import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Role } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QuoteOrderDto } from './dto/quote-order.dto';
import { findCoupon, priceOrder } from './pricing';
import { priceDeals, type PricingDeal, type PricingLine } from './deal-pricing';

/** Everything a storefront or admin view needs about an order, in one query. */
const withDetail = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          title: true,
          unit: true,
          art: true,
          hue: true,
          imageUrl: true,
        },
      },
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
  /**
   * Prices a basket: what it costs, what the shop's promotions took off, and
   * what a coupon adds to that.
   *
   * Shared by `quote` and `create` on purpose. Checkout used to compute its own
   * totals in the browser, and the two copies had already drifted — the page
   * judged free delivery on the discounted amount while the server judged it on
   * the subtotal, so the figure shown and the figure charged could differ. One
   * implementation, used by the page that displays it and the endpoint that
   * bills it, cannot disagree with itself.
   */
  private async priceBasket(
    userId: number,
    items: { productId: number; quantity: number }[],
    couponCode?: string | null,
    /** Order placement rejects a short basket; a quote only reports it. */
    enforceStock = true,
  ) {
    const ids = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
    });

    if (products.length !== new Set(ids).size) {
      throw new BadRequestException(
        'Your basket contains an item that no longer exists',
      );
    }

    const byId = new Map(products.map((p) => [p.id, p]));

    for (const line of items) {
      const product = byId.get(line.productId);
      if (!product) throw new BadRequestException('Unknown product in basket');
      if (enforceStock && product.stock < line.quantity) {
        throw new BadRequestException(
          `${product.title} only has ${product.stock} left`,
        );
      }
    }

    const subtotal = items.reduce((sum, line) => {
      const product = byId.get(line.productId)!;
      return sum + Number(product.price) * line.quantity;
    }, 0);

    /* Promotions are applied to the basket without the customer asking, which
       is the whole point of advertising them on the shelf. */
    const lines: PricingLine[] = items.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: Number(byId.get(line.productId)!.price),
    }));
    const dealBreakdown = priceDeals(lines, await this.activeDealsFor(ids));

    const totals = priceOrder(
      subtotal,
      couponCode,
      await this.mayRedeem(userId, couponCode),
      dealBreakdown.total,
    );

    return { byId, totals, dealBreakdown };
  }

  /** Prices a basket without placing it, so checkout shows what will be charged. */
  async quote(userId: number, dto: QuoteOrderDto) {
    const { totals, dealBreakdown } = await this.priceBasket(
      userId,
      dto.items,
      dto.couponCode,
      false,
    );
    return { ...totals, deals: dealBreakdown.lines };
  }

  async create(userId: number, dto: CreateOrderDto) {
    const { byId, totals } = await this.priceBasket(
      userId,
      dto.items,
      dto.couponCode,
    );

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
          dealDiscount: totals.dealDiscount,
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

      /*
       * The stock check above is friendly, not authoritative.
       *
       * It runs before this transaction so the customer gets a useful message
       * naming the item that fell short. But two orders placed at the same
       * moment both pass it while stock is still whole, and an unconditional
       * decrement then takes the same unit twice — sold four of three, stock
       * left at minus one.
       *
       * So the guarantee lives here instead: `updateMany` filtered on there
       * still being enough left makes the test and the decrement one statement,
       * which Postgres serialises per row. Losing that race matches no rows,
       * and throwing rolls back the order rather than shipping what is not on
       * the shelf.
       */
      for (const line of dto.items) {
        const taken = await tx.product.updateMany({
          where: { id: line.productId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });

        if (taken.count === 0) {
          const title = byId.get(line.productId)?.title ?? 'An item';
          throw new BadRequestException(
            `${title} sold out while you were checking out`,
          );
        }
      }

      return order;
    });
  }

  /**
   * The live promotions covering any of these products.
   *
   * Only `active` decides whether a promotion is running. `endsInHours` drives
   * the countdown badge on the storefront, but the admin panel ends a deal with
   * its End button, which clears `active` — treating the countdown as
   * authoritative here would silently stop honouring a deal the shop still
   * shows as live, which is the mismatch this whole change exists to remove.
   */
  private async activeDealsFor(productIds: number[]): Promise<PricingDeal[]> {
    const deals = await this.prisma.deal.findMany({
      where: { active: true, products: { some: { id: { in: productIds } } } },
      include: { products: { select: { id: true } } },
    });

    return deals.map((d) => ({
      id: d.id,
      kind: d.kind,
      title: d.title,
      percentOff: d.percentOff,
      productIds: d.products.map((p) => p.id),
    }));
  }

  /**
   * Whether this customer may still redeem this code.
   *
   * Judged from orders they have actually placed rather than from anything the
   * browser sends, and cancelled orders are ignored so a cancellation does not
   * burn a one-time offer. An unknown code answers true and is then discarded
   * by the pricing rules, which keeps "no such coupon" and "already used" from
   * needing different handling here.
   */
  private async mayRedeem(
    userId: number,
    code?: string | null,
  ): Promise<boolean> {
    const coupon = findCoupon(code);
    if (!coupon || coupon.redemption === 'unlimited') return true;

    if (coupon.redemption === 'first-order') {
      const previous = await this.prisma.order.count({
        where: { userId, status: { not: OrderStatus.CANCELLED } },
      });
      return previous === 0;
    }

    const used = await this.prisma.order.count({
      where: {
        userId,
        couponCode: coupon.code,
        status: { not: OrderStatus.CANCELLED },
      },
    });
    return used === 0;
  }

  /**
   * Answers whether this customer can use a code, before they commit to it.
   *
   * The storefront cannot work this out on its own — redemption depends on
   * order history it does not hold — and showing a discount that the order
   * endpoint then refuses reads as the shop breaking its promise. So checkout
   * asks here and reports the same answer the order will act on.
   */
  async checkCoupon(userId: number, code: string, subtotal: number) {
    const coupon = findCoupon(code);
    if (!coupon)
      return { ok: false as const, reason: "That code isn't recognised" };

    if (coupon.minSpend != null && subtotal < coupon.minSpend) {
      return {
        ok: false as const,
        reason: `Spend $${coupon.minSpend.toFixed(2)} to use this code`,
      };
    }

    if (!(await this.mayRedeem(userId, coupon.code))) {
      return {
        ok: false as const,
        reason:
          coupon.redemption === 'first-order'
            ? 'This code is for your first order'
            : "You've already used this code",
      };
    }

    const totals = priceOrder(subtotal, coupon.code, true);
    return {
      ok: true as const,
      code: coupon.code,
      description: coupon.description,
      discount: totals.discount,
    };
  }

  /** A customer's own orders, newest first. */
  findMine(userId: number) {
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
  async findOne(id: number, userId: number, role: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: withDetail,
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    if (role !== Role.ADMIN && order.userId !== userId) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  async updateStatus(id: number, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    /* Cancelling releases the stock the order was holding, so a cancelled
       order does not quietly keep items out of the shop. */
    if (
      status === OrderStatus.CANCELLED &&
      order.status !== OrderStatus.CANCELLED
    ) {
      return this.prisma.$transaction(async (tx) => {
        const items = await tx.orderItem.findMany({ where: { orderId: id } });
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        return tx.order.update({
          where: { id },
          data: { status },
          include: withDetail,
        });
      });
    }

    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: withDetail,
    });
  }

  /** Figures the admin dashboard and reports are built from. */
  async stats() {
    const orders = await this.prisma.order.findMany({
      where: { status: { not: OrderStatus.CANCELLED } },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, title: true, departmentSlug: true },
            },
          },
        },
      },
      orderBy: { placedAt: 'desc' },
    });

    const customers = await this.prisma.user.count({
      where: { role: Role.CUSTOMER },
    });
    return { orders, customers };
  }
}
