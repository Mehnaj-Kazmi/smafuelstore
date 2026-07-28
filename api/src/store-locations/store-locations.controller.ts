import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { StoreLocationsService } from './store-locations.service';

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
      throw new BadRequestException('lat and lng query params are required numbers');
    }
    return this.storeLocations.nearest(latNum, lngNum);
  }
}
