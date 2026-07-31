import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CatalogModule } from './catalog/catalog.module';
import { StoreLocationsModule } from './store-locations/store-locations.module';
import { UploadsModule } from './uploads/uploads.module';
import { DealsModule } from './deals/deals.module';
import { HomeModule } from './home/home.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    /*
     * A ceiling on how fast one caller can hit the API.
     *
     * Without it a password could be guessed at whatever rate the network
     * allows, and the forgot-password route would post an email to any
     * registered address as often as someone cared to ask. This is the blanket
     * limit; the routes worth attacking set their own tighter ones with
     * @Throttle, since 120/min is generous for browsing but far too kind for a
     * login form.
     */
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    PrismaModule,
    MailModule,
    AuthModule,
    ProductsModule,
    CatalogModule,
    StoreLocationsModule,
    UploadsModule,
    DealsModule,
    HomeModule,
    OrdersModule,
    ReviewsModule,
  ],
  /* Applied globally rather than per-controller, so a route added later is
     covered by default instead of being forgotten. */
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
