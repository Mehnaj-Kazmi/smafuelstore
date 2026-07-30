import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrderStatus, Role } from '../../generated/prisma/client';

/** The signed-in user, as attached by JwtStrategy.validate. */
type AuthedRequest = { user: { id: number; email: string; role: Role; name: string } };

@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  /* Every route here needs a session — orders always belong to someone. */

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateOrderDto) {
    return this.orders.create(req.user.id, dto);
  }

  /** The signed-in customer's own orders. */
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@Req() req: AuthedRequest) {
    return this.orders.findMine(req.user.id);
  }

  // Admin views. Declared before ':id' so "all" and "stats" are not read as ids.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('all')
  findAll() {
    return this.orders.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('stats')
  stats() {
    return this.orders.stats();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.orders.findOne(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      throw new BadRequestException(
        `status must be one of: ${Object.values(OrderStatus).join(', ')}`,
      );
    }
    return this.orders.updateStatus(id, status as OrderStatus);
  }
}
