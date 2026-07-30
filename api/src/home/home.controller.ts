import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HomeService } from './home.service';
import {
  CreateHeroSlideDto,
  CreateShowcaseCardDto,
  UpdateHeroSlideDto,
  UpdateShowcaseCardDto,
} from './dto/home.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../../generated/prisma/client';

/** Editable home page content: the hero carousel and the showcase card grid. */
@Controller('home')
export class HomeController {
  constructor(private home: HomeService) {}

  // Public: the storefront renders these on every visit.
  @Get('hero-slides')
  heroSlides(@Query('includeInactive') includeInactive?: string) {
    return this.home.heroSlides(includeInactive === 'true');
  }

  @Get('showcase-cards')
  showcaseCards(@Query('includeInactive') includeInactive?: string) {
    return this.home.showcaseCards(includeInactive === 'true');
  }

  // Admin-only writes.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('hero-slides')
  createHeroSlide(@Body() dto: CreateHeroSlideDto) {
    return this.home.createHeroSlide(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('hero-slides/:id')
  updateHeroSlide(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHeroSlideDto) {
    return this.home.updateHeroSlide(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('hero-slides/:id')
  removeHeroSlide(@Param('id', ParseIntPipe) id: number) {
    return this.home.removeHeroSlide(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('showcase-cards')
  createShowcaseCard(@Body() dto: CreateShowcaseCardDto) {
    return this.home.createShowcaseCard(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('showcase-cards/:id')
  updateShowcaseCard(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShowcaseCardDto) {
    return this.home.updateShowcaseCard(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('showcase-cards/:id')
  removeShowcaseCard(@Param('id', ParseIntPipe) id: number) {
    return this.home.removeShowcaseCard(id);
  }
}
