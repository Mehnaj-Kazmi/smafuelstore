import { Body, Controller, Get, NotFoundException, Param, Patch, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../../generated/prisma/client';

@Controller()
export class CatalogController {
  constructor(private prisma: PrismaService) {}

  /*
   * Ordered by `sortOrder` then name, so the admin controls the order of the
   * "Shop by department" row rather than it being alphabetical by accident.
   */
  @Get('departments')
  departments() {
    return this.prisma.department.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  @Get('categories')
  categories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  // Admin-only: departments are edited, never created or deleted here — the
  // catalogue's shape is fixed by the products that reference these slugs.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('departments/:slug')
  async updateDepartment(@Param('slug') slug: string, @Body() dto: UpdateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({ where: { slug } });
    if (!existing) throw new NotFoundException(`Department ${slug} not found`);

    return this.prisma.department.update({ where: { slug }, data: dto });
  }
}
