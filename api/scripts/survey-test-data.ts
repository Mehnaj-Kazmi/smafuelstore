import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/** Read-only. Shows what a cleanup would remove, before anything is removed. */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** The one account that must survive: the shop's own administrator. */
const KEEP_EMAILS = ['admin@smafuel.market'];

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { orders: true, reviews: true, addresses: true } } },
  });

  const keep = users.filter((u) => KEEP_EMAILS.includes(u.email) || u.role === 'ADMIN');
  const remove = users.filter((u) => !keep.some((k) => k.id === u.id));

  console.log(`USERS: ${users.length} total\n`);
  console.log('  KEEPING:');
  for (const u of keep) {
    console.log(`    #${u.id} ${u.email} (${u.role}) — ${u._count.orders} orders, ${u._count.reviews} reviews`);
  }

  console.log(`\n  WOULD REMOVE: ${remove.length} account(s)`);
  for (const u of remove.slice(0, 12)) {
    console.log(`    #${u.id} ${u.email} — ${u._count.orders} orders, ${u._count.reviews} reviews`);
  }
  if (remove.length > 12) console.log(`    …and ${remove.length - 12} more`);

  const orders = await prisma.order.count();
  const reviews = await prisma.review.count();
  const addresses = await prisma.address.count();
  const tokens = await prisma.passwordResetToken.count();

  console.log(`\nORDERS:    ${orders}`);
  console.log(`REVIEWS:   ${reviews}`);
  console.log(`ADDRESSES: ${addresses}`);
  console.log(`RESET TOKENS: ${tokens}`);

  const rated = await prisma.product.findMany({
    where: { reviews: { gt: 0 } },
    select: { sku: true, title: true, rating: true, reviews: true },
  });
  console.log(`\nPRODUCTS CARRYING A RATING: ${rated.length}`);
  for (const p of rated) console.log(`    ${p.sku}  ${p.rating.toFixed(1)}★ from ${p.reviews}`);

  console.log('\nNOTHING HAS BEEN DELETED — this is a survey only.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
