import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class CatalogController {
  constructor(private prisma: PrismaService) {}

  @Get('departments')
  departments() {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
  }

  @Get('categories')
  categories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }
}
