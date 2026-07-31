import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '../../generated/prisma/client';

/** The signed-in user, as attached by JwtStrategy.validate. */
type AuthedRequest = { user: { id: number; email: string; role: Role; name: string } };

function parseProductId(productId?: string): number {
  const id = Number(productId);
  if (!productId || !Number.isInteger(id)) throw new BadRequestException('productId is required');
  return id;
}

@Controller('reviews')
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  // Public: anyone browsing a product page sees its reviews.
  @Get()
  forProduct(@Query('productId') productId?: string) {
    return this.reviews.forProduct(parseProductId(productId));
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  mine(@Req() req: AuthedRequest, @Query('productId') productId?: string) {
    return this.reviews.mine(parseProductId(productId), req.user.id);
  }

  /*
   * One review per product already caps how much a single account can say about
   * any one item, but nothing stopped it walking the catalogue and rating every
   * product in a loop. Someone reconsidering a handful of opinions stays well
   * under this; a script writing the whole shelf does not.
   */
  @Throttle({ default: { ttl: 3_600_000, limit: 15 } })
  @UseGuards(JwtAuthGuard)
  @Post()
  upsert(@Req() req: AuthedRequest, @Body() dto: CreateReviewDto) {
    return this.reviews.upsert(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.reviews.remove(id, req.user.id, req.user.role);
  }
}
