import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

/** Products are returned with each deal so the storefront needs one request. */
const withProducts = {
  products: { select: { id: true, title: true, price: true, art: true, hue: true, imageUrl: true } },
} as const;

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.deal.findMany({
      where: includeInactive ? {} : { active: true },
      include: withProducts,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const deal = await this.prisma.deal.findUnique({ where: { id }, include: withProducts });
    if (!deal) throw new NotFoundException(`Deal ${id} not found`);
    return deal;
  }

  create(dto: CreateDealDto) {
    const { productIds, ...rest } = dto;
    return this.prisma.deal.create({
      data: { ...rest, products: { connect: productIds.map((id) => ({ id })) } },
      include: withProducts,
    });
  }

  async update(id: number, dto: UpdateDealDto) {
    await this.findOne(id);
    const { productIds, ...rest } = dto;

    return this.prisma.deal.update({
      where: { id },
      data: {
        ...rest,
        /* `set` rather than `connect`: an edit replaces the promotion's product
           list outright, so removing an item from the form has to remove it
           from the deal. `connect` alone would only ever add. */
        ...(productIds ? { products: { set: productIds.map((pid) => ({ id: pid })) } } : {}),
      },
      include: withProducts,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.deal.delete({ where: { id } });
  }
}
