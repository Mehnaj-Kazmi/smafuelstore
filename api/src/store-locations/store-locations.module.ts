import { Module } from '@nestjs/common';
import { StoreLocationsService } from './store-locations.service';
import { StoreLocationsController } from './store-locations.controller';

@Module({
  providers: [StoreLocationsService],
  controllers: [StoreLocationsController],
})
export class StoreLocationsModule {}
