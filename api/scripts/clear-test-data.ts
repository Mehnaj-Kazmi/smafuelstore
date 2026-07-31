import { readFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Returns the shop to a clean slate after a testing session.
 *
 * Removes every customer account, order, address and review created while the
 * work was being checked, leaving the catalogue, promotions, home page and
 * uploaded photographs untouched. The administrator survives, because deleting
 * it would lock the shop's owner out of their own admin panel.
 *
 * Stock is put back to the seeded figures, since concurrency testing left
 * several products sitting at implausible quantities.
 *
 * Run with:  npx tsx scripts/clear-test-data.ts
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const KEEP_EMAIL = 'admin@smafuel.market';

/**
 * The seeded stock for each sku, read from the seed file rather than copied.
 *
 * A second hardcoded list would drift the moment the catalogue changed, and
 * quietly restore the wrong numbers.
 */
function seededStock(): Map<string, number> {
  const source = readFileSync(join(__dirname, '..', 'prisma', 'seed.ts'), 'utf8');
  const stock = new Map<string, number>();

  for (const line of source.split('\n')) {
    const sku = line.match(/sku:\s*'([^']+)'/);
    const qty = line.match(/stock:\s*(\d+)/);
    if (sku && qty) stock.set(sku[1], Number(qty[1]));
  }
  return stock;
}

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: KEEP_EMAIL } });
  if (!admin) throw new Error(`Refusing to run: ${KEEP_EMAIL} not found, so nothing would be left to sign in with`);

  const before = {
    users: await prisma.user.count(),
    orders: await prisma.order.count(),
    reviews: await prisma.review.count(),
  };

  /*
   * Order matters. An order points at an address, and an address belongs to a
   * user, so deleting users first would be refused while orders still
   * reference their addresses. Children first, parents last.
   */
  const items = await prisma.orderItem.deleteMany({});
  const orders = await prisma.order.deleteMany({});
  const reviews = await prisma.review.deleteMany({});
  const addresses = await prisma.address.deleteMany({});
  const tokens = await prisma.passwordResetToken.deleteMany({});
  const users = await prisma.user.deleteMany({ where: { email: { not: KEEP_EMAIL } } });

  /* Every rating came from a review that no longer exists, so the cached
     averages have to go back to zero rather than be left stranded. */
  const cleared = await prisma.product.updateMany({
    where: { OR: [{ rating: { not: 0 } }, { reviews: { not: 0 } }] },
    data: { rating: 0, reviews: 0 },
  });

  const stock = seededStock();
  let restored = 0;
  for (const [sku, qty] of stock) {
    const product = await prisma.product.findUnique({ where: { sku } });
    if (!product || product.stock === qty) continue;
    await prisma.product.update({ where: { sku }, data: { stock: qty } });
    restored += 1;
  }

  console.log('  removed:');
  console.log(`    ${users.count} customer account(s)   (was ${before.users} total, admin kept)`);
  console.log(`    ${orders.count} order(s)             (${items.count} line items)`);
  console.log(`    ${reviews.count} review(s)`);
  console.log(`    ${addresses.count} address(es)`);
  console.log(`    ${tokens.count} password reset token(s)`);
  console.log('  reset:');
  console.log(`    ${cleared.count} product rating(s) back to zero`);
  console.log(`    ${restored} product stock level(s) back to seeded values`);

  console.log('\n  kept untouched: catalogue, promotions, home page, store, uploaded photos');
  console.log(`  remaining accounts: ${await prisma.user.count()} (${KEEP_EMAIL})`);
  console.log(`  remaining orders:   ${await prisma.order.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
