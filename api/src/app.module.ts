import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CatalogModule } from './catalog/catalog.module';
import { StoreLocationsModule } from './store-locations/store-locations.module';
import { UploadsModule } from './uploads/uploads.module';
import { DealsModule } from './deals/deals.module';
import { HomeModule } from './home/home.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    CatalogModule,
    StoreLocationsModule,
    UploadsModule,
    DealsModule,
    HomeModule,
    OrdersModule,
  ],
})
export class AppModule {}
