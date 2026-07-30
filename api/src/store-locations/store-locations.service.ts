import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStoreDto } from './dto/update-store.dto';

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in miles between two coordinates. */
export function haversineMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

@Injectable()
export class StoreLocationsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.storeLocation.findMany({ include: { fuelPrices: true } });
  }

  /**
   * Updates a store, replacing its fuel prices wholesale when supplied.
   *
   * Prices are deleted and recreated rather than diffed: the grid is edited as
   * one block in the admin, so a grade removed there must disappear here, and
   * an upsert-only pass would leave it behind for ever.
   */
  async update(id: number, dto: UpdateStoreDto) {
    const store = await this.prisma.storeLocation.findUnique({ where: { id } });
    if (!store) throw new NotFoundException(`Store ${id} not found`);

    const { fuelPrices, ...rest } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (fuelPrices) {
        await tx.fuelPrice.deleteMany({ where: { storeId: id } });
        await tx.fuelPrice.createMany({
          data: fuelPrices.map((f) => ({ storeId: id, grade: f.grade, price: f.price })),
        });
      }
      return tx.storeLocation.update({
        where: { id },
        data: rest,
        include: { fuelPrices: true },
      });
    });
  }

  async nearest(lat: number, lng: number) {
    const stores = await this.prisma.storeLocation.findMany({ include: { fuelPrices: true } });
    if (stores.length === 0) return null;

    let best = stores[0];
    let bestDistance = haversineMiles({ lat, lng }, best);

    for (const store of stores.slice(1)) {
      const d = haversineMiles({ lat, lng }, store);
      if (d < bestDistance) {
        best = store;
        bestDistance = d;
      }
    }

    return { store: best, distance: bestDistance, inRange: bestDistance <= best.radiusMiles };
  }
}
