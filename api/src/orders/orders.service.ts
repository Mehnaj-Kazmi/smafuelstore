import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Role } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { priceOrder } from './pricing';

/** Everything a storefront or admin view needs about an order, in one query. */
const withDetail = {
  items: {
    include: {
      product: { select: { id: true, title: true, unit: true, art: true, hue: true, imageUrl: true } },
    },
  },
  address: true,
  user: { select: { id: true, name: true, email: true, phone: true } },
} as const;

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Places an order.
   *
   * Prices, discounts and totals are read from the database and recalculated
   * here — never taken from the request. The browser sends product ids and
   * quantities only, so a tampered payload cannot set its own price.
   *
   * The whole thing runs in one transaction: if any line is out of stock the
   * order is not written and no stock is taken. Otherwise a customer could end
   * up with a half-fulfilled order and the shop with wrong inventory.
   */
  async create(userId: string, dto: CreateOrderDto) {
    const ids = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: ids } } });

    if (products.length !== new Set(ids).size) {
      throw new BadRequestException('Your basket contains an item that no longer exists');
    }

    const byId = new Map(products.map((p) => [p.id, p]));

    for (const line of dto.items) {
      const product = byId.get(line.productId);
      if (!product) throw new BadRequestException('Unknown product in basket');
      if (product.stock < line.quantity) {
        throw new BadRequestException(
          `${product.title} only has ${product.stock} left`,
        );
      }
    }

    const subtotal = dto.items.reduce((sum, line) => {
      const product = byId.get(line.productId)!;
      return sum + Number(product.price) * line.quantity;
    }, 0);

    const totals = priceOrder(subtotal, dto.couponCode);

    return this.prisma.$transaction(async (tx) => {
      const address = await tx.address.create({
        data: {
          userId,
          label: 'Delivery',
          recipient: dto.address.recipient,
          line1: dto.address.line1,
          city: dto.address.city,
          zip: dto.address.zip,
          notes: dto.address.notes || null,
        },
      });

      const order = await tx.order.create({
        data: {
          userId,
          addressId: address.id,
          subtotal: totals.subtotal,
          discount: totals.discount,
          deliveryFee: totals.deliveryFee,
          tax: totals.tax,
          total: totals.total,
          couponCode: totals.couponCode,
          status: OrderStatus.PENDING,
          items: {
            create: dto.items.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
              unitPrice: byId.get(line.productId)!.price,
            })),
          },
        },
        include: withDetail,
      });

      for (const line of dto.items) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.quantity } },
        });
      }

      return order;
    });
  }

  /** A customer's own orders, newest first. */
  findMine(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: withDetail,
      orderBy: { placedAt: 'desc' },
    });
  }

  /** Every order in the shop — admin only. */
  findAll() {
    return this.prisma.order.findMany({
      include: withDetail,
      orderBy: { placedAt: 'desc' },
    });
  }

  /**
   * One order. A customer may only read their own; an admin may read any, so
   * order ids cannot be walked to read other people's addresses.
   */
  async findOne(id: string, userId: string, role: Role) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: withDetail });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    if (role !== Role.ADMIN && order.userId !== userId) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    /* Cancelling releases the stock the order was holding, so a cancelled
       order does not quietly keep items out of the shop. */
    if (status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      return this.prisma.$transaction(async (tx) => {
        const items = await tx.orderItem.findMany({ where: { orderId: id } });
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        return tx.order.update({ where: { id }, data: { status }, include: withDetail });
      });
    }

    return this.prisma.order.update({ where: { id }, data: { status }, include: withDetail });
  }

  /** Figures the admin dashboard and reports are built from. */
  async stats() {
    const orders = await this.prisma.order.findMany({
      where: { status: { not: OrderStatus.CANCELLED } },
      include: { items: { include: { product: { select: { id: true, title: true, departmentSlug: true } } } } },
      orderBy: { placedAt: 'desc' },
    });

    const customers = await this.prisma.user.count({ where: { role: Role.CUSTOMER } });
    return { orders, customers };
  }
}
