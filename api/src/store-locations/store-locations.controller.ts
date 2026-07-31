import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StoreLocationsService } from './store-locations.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../../generated/prisma/client';

@Controller('store-locations')
export class StoreLocationsController {
  constructor(private storeLocations: StoreLocationsService) {}

  @Get()
  findAll() {
    return this.storeLocations.findAll();
  }

  @Get('nearest')
  async nearest(@Query('lat') lat: string, @Query('lng') lng: string) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      throw new BadRequestException(
        'lat and lng query params are required numbers',
      );
    }
    return this.storeLocations.nearest(latNum, lngNum);
  }

  // Admin-only. The coordinates here decide who the shop will deliver to.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStoreDto) {
    return this.storeLocations.update(id, dto);
  }
}
