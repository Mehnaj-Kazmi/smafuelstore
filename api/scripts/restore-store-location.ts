import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Puts the shop back in Karachi.
 *
 * The store row is operator-configured — name, address, coordinates and the
 * delivery radius are all set in the admin panel — and it was reset to the
 * seeded Riverside values when the database was rebuilt. Everything then read
 * as "Outside delivery area", because the radius check was measuring the
 * distance from Karachi to California.
 *
 * Coordinates are the best fix for Clifton Block 8 and should be confirmed
 * against the real shopfront in Admin → Store; the radius check is only as good
 * as this pin.
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const store = await prisma.storeLocation.findFirst();
  if (!store) throw new Error('No store row to update');

  const updated = await prisma.storeLocation.update({
    where: { id: store.id },
    data: {
      name: 'SMA Fuel & Market — Karachi',
      address: 'Clifton Block 8',
      city: 'Karachi',
      lat: 24.811,
      lng: 67.029,
      radiusMiles: 5,
    },
    include: { fuelPrices: true },
  });

  console.log('store restored:');
  console.log({
    name: updated.name,
    address: updated.address,
    city: updated.city,
    lat: updated.lat,
    lng: updated.lng,
    radiusMiles: updated.radiusMiles,
  });
  console.log(`fuel grades on file: ${updated.fuelPrices.length} (seeded values — re-check your own prices)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
