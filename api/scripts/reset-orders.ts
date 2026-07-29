import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Clears every order and returns the stock they were holding.
 *
 * Intended for wiping test orders so the shop starts from a true zero — the
 * admin dashboard is computed from real orders, so leftover test traffic would
 * show up as revenue.
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const live = await prisma.order.findMany({
    where: { status: { not: 'CANCELLED' } },
    include: { items: true },
  });

  for (const order of live) {
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }

  const items = await prisma.orderItem.deleteMany({});
  const orders = await prisma.order.deleteMany({});
  const addresses = await prisma.address.deleteMany({});

  console.log(`  stock returned for ${live.length} live order(s)`);
  console.log(`  deleted ${orders.count} order(s), ${items.count} line(s), ${addresses.count} address(es)`);
  console.log(`  orders remaining: ${await prisma.order.count()}`);
  await prisma.$disconnect();
}

void main();
