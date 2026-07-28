import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateHeroSlideDto,
  CreateShowcaseCardDto,
  UpdateHeroSlideDto,
  UpdateShowcaseCardDto,
} from './dto/home.dto';

@Injectable()
export class HomeService {
  constructor(private prisma: PrismaService) {}

  /* ---- Hero slides ---------------------------------------------------- */

  heroSlides(includeInactive = false) {
    return this.prisma.heroSlide.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  createHeroSlide(dto: CreateHeroSlideDto) {
    return this.prisma.heroSlide.create({
      data: {
        ...dto,
        tileImages: dto.tileImages ?? [],
        fallbackArt: dto.fallbackArt ?? [],
      },
    });
  }

  async updateHeroSlide(id: string, dto: UpdateHeroSlideDto) {
    await this.findHeroSlide(id);
    return this.prisma.heroSlide.update({ where: { id }, data: dto });
  }

  async removeHeroSlide(id: string) {
    await this.findHeroSlide(id);
    return this.prisma.heroSlide.delete({ where: { id } });
  }

  private async findHeroSlide(id: string) {
    const slide = await this.prisma.heroSlide.findUnique({ where: { id } });
    if (!slide) throw new NotFoundException(`Hero slide ${id} not found`);
    return slide;
  }

  /* ---- Showcase cards -------------------------------------------------- */

  showcaseCards(includeInactive = false) {
    return this.prisma.showcaseCard.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  createShowcaseCard(dto: CreateShowcaseCardDto) {
    return this.prisma.showcaseCard.create({
      data: { ...dto, tiles: dto.tiles as unknown as Prisma.InputJsonValue },
    });
  }

  async updateShowcaseCard(id: string, dto: UpdateShowcaseCardDto) {
    await this.findShowcaseCard(id);
    const { tiles, ...rest } = dto;
    return this.prisma.showcaseCard.update({
      where: { id },
      data: {
        ...rest,
        ...(tiles ? { tiles: tiles as unknown as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async removeShowcaseCard(id: string) {
    await this.findShowcaseCard(id);
    return this.prisma.showcaseCard.delete({ where: { id } });
  }

  private async findShowcaseCard(id: string) {
    const card = await this.prisma.showcaseCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundException(`Showcase card ${id} not found`);
    return card;
  }
}
