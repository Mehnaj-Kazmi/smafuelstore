import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Role } from '../../generated/prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /** Real reviews for a product, newest first, plus the average/count/breakdown a PDP renders. */
  async forProduct(productId: number) {
    const [items, grouped, agg] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { productId },
        _count: { _all: true },
      }),
      this.prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    const breakdown: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };
    for (const g of grouped) breakdown[String(g.rating)] = g._count._all;

    return {
      average: agg._avg?.rating ?? 0,
      count: agg._count._all,
      breakdown,
      items,
    };
  }

  /** The signed-in customer's own review for this product, or null if they have not left one. */
  mine(productId: number, userId: number) {
    return this.prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
      include: { user: { select: { name: true } } },
    });
  }

  /**
   * Creates the customer's review, or edits it in place if they already left
   * one for this product — one review per person per item, matching the
   * `@@unique([productId, userId])` constraint, so "submit" always means
   * "this is now what I think," not a second stacked entry.
   */
  async upsert(userId: number, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new BadRequestException('Unknown product');

    /*
     * Stamped from real order history rather than trusted from the request —
     * a "Verified purchase" badge that anyone could set on their own review
     * would be worse than not having one.
     */
    const purchase = await this.prisma.orderItem.findFirst({
      where: {
        productId: dto.productId,
        order: { userId, status: { not: 'CANCELLED' } },
      },
    });

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.upsert({
        where: { productId_userId: { productId: dto.productId, userId } },
        update: {
          rating: dto.rating,
          title: dto.title,
          body: dto.body,
          verifiedPurchase: Boolean(purchase),
        },
        create: {
          productId: dto.productId,
          userId,
          rating: dto.rating,
          title: dto.title,
          body: dto.body,
          verifiedPurchase: Boolean(purchase),
        },
        include: { user: { select: { name: true } } },
      });

      const agg = await tx.review.aggregate({
        where: { productId: dto.productId },
        _avg: { rating: true },
        _count: { _all: true },
      });
      await tx.product.update({
        where: { id: dto.productId },
        data: { rating: agg._avg?.rating ?? 0, reviews: agg._count._all },
      });

      return review;
    });
  }

  async remove(id: number, userId: number, role: Role) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException('You can only delete your own review');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });

      const agg = await tx.review.aggregate({
        where: { productId: review.productId },
        _avg: { rating: true },
        _count: { _all: true },
      });
      await tx.product.update({
        where: { id: review.productId },
        data: { rating: agg._avg?.rating ?? 0, reviews: agg._count._all },
      });

      return { id };
    });
  }
}
