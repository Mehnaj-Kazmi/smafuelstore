/**
 * Copies the live PostgreSQL database out to a MySQL script.
 *
 * The shop is moving to Windows hosting that offers no Postgres, and the one
 * thing that must not happen is losing what is already there — the photographs in
 * particular, which were rebuilt by hand once already after a wipe cleared every
 * `imageUrl`. So this reads, it never writes: Postgres is left exactly as it is,
 * and the output is a file that can be inspected before anything is loaded.
 *
 * Ids are carried across unchanged. They appear in URLs the customer may have
 * bookmarked, in the admin's own "order 41", and in every `imageUrl` mapping, and
 * renumbering would quietly break all three.
 *
 * Run with:
 *   npx tsx scripts/export-to-mysql.ts
 */
import 'dotenv/config';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const OUT = join(__dirname, '..', '..', 'mysql-import.sql');

/** Longest value each column will take, so an overflow is reported not truncated. */
const LIMITS: Record<string, Record<string, number>> = {
  Departments: { Blurb: 255 },
  Reviews: { Body: 2000, Title: 120 },
  HeroSlides: { Blurb: 500 },
  Deals: { Detail: 500 },
  Products: { Title: 255, Brand: 120, Unit: 80 },
};

const warnings: string[] = [];

function quote(value: unknown, table: string, column: string): string {
  if (value === null || value === undefined) return 'NULL';

  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'bigint') return String(value);

  if (value instanceof Date) {
    /* MySQL DATETIME(6) has no timezone, and the .NET side reads these back as
       UTC. Formatting in UTC keeps a timestamp meaning the same moment rather
       than shifting by whatever the exporting machine's offset happens to be. */
    return `'${value.toISOString().slice(0, 23).replace('T', ' ')}'`;
  }

  /* Prisma hands Decimal back as an object; its string form is exact, where
     converting through a float would round money. */
  if (typeof value === 'object' && value !== null && 'toFixed' in value) {
    return `'${String(value)}'`;
  }

  const text = Array.isArray(value) || typeof value === 'object'
    ? JSON.stringify(value)
    : String(value);

  const limit = LIMITS[table]?.[column];
  if (limit && text.length > limit) {
    warnings.push(`${table}.${column} is ${text.length} chars, column holds ${limit}`);
  }

  return `'${text.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function insert(table: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return `-- ${table}: nothing to copy\n`;

  const columns = Object.keys(rows[0]);
  const values = rows
    .map((row) => `(${columns.map((c) => quote(row[c], table, c)).join(', ')})`)
    .join(',\n  ');

  return (
    `-- ${table}: ${rows.length} row${rows.length === 1 ? '' : 's'}\n` +
    `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES\n  ${values};\n`
  );
}

async function main() {
  const [
    users, addresses, departments, categories, products,
    stores, fuelPrices, heroSlides, showcaseCards, deals,
    orders, orderItems, reviews, resetTokens,
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { id: 'asc' } }),
    prisma.address.findMany({ orderBy: { id: 'asc' } }),
    prisma.department.findMany({ orderBy: { slug: 'asc' } }),
    prisma.category.findMany({ orderBy: { slug: 'asc' } }),
    prisma.product.findMany({ orderBy: { id: 'asc' } }),
    prisma.storeLocation.findMany({ orderBy: { id: 'asc' } }),
    prisma.fuelPrice.findMany({ orderBy: { id: 'asc' } }),
    prisma.heroSlide.findMany({ orderBy: { id: 'asc' } }),
    prisma.showcaseCard.findMany({ orderBy: { id: 'asc' } }),
    prisma.deal.findMany({ orderBy: { id: 'asc' }, include: { products: { select: { id: true } } } }),
    prisma.order.findMany({ orderBy: { id: 'asc' } }),
    prisma.orderItem.findMany({ orderBy: { id: 'asc' } }),
    prisma.review.findMany({ orderBy: { id: 'asc' } }),
    prisma.passwordResetToken.findMany({ orderBy: { id: 'asc' } }),
  ]);

  const parts: string[] = [
    '-- SMA Fuel & Market — PostgreSQL to MySQL',
    `-- Written ${new Date().toISOString()}`,
    '--',
    '-- Ids are preserved deliberately: they appear in bookmarked URLs, in the',
    '-- admin panel, and in the photograph mappings, and renumbering would break',
    '-- all three. Loaded inside one transaction so a failure leaves nothing',
    '-- half-copied.',
    '',
    'SET FOREIGN_KEY_CHECKS = 0;',
    'START TRANSACTION;',
    '',
  ];

  /* Parents before children, so the data reads sensibly even though foreign-key
     checks are off for the load. */
  parts.push(insert('Departments', departments.map((d) => ({
    Slug: d.slug, Name: d.name, Blurb: d.blurb, ImageUrl: d.imageUrl,
    Art: d.art, Hue: d.hue, AgeRestricted: d.ageRestricted, SortOrder: d.sortOrder,
  }))));

  parts.push(insert('Categories', categories.map((c) => ({
    Slug: c.slug, Name: c.name, Art: c.art, Hue: c.hue, DepartmentSlug: c.departmentSlug,
  }))));

  parts.push(insert('Users', users.map((u) => ({
    Id: u.id, Email: u.email, PasswordHash: u.passwordHash, Name: u.name,
    Phone: u.phone, Role: u.role, CreatedAt: u.createdAt, UpdatedAt: u.updatedAt,
  }))));

  parts.push(insert('Addresses', addresses.map((a) => ({
    Id: a.id, UserId: a.userId, Label: a.label, Line1: a.line1, Line2: a.line2,
    City: a.city, State: a.state, Zip: a.zip, Recipient: a.recipient,
    Notes: a.notes, Lat: a.lat, Lng: a.lng, IsDefault: a.isDefault, CreatedAt: a.createdAt,
  }))));

  /* Arrays become JSON text: Postgres had a native array type, MySQL has not.
     The .NET side reads these back through the same JsonArray helper. */
  parts.push(insert('Products', products.map((p) => ({
    Id: p.id, Sku: p.sku, Barcode: p.barcode, Title: p.title, Brand: p.brand,
    DepartmentSlug: p.departmentSlug, CategorySlug: p.categorySlug, Unit: p.unit,
    Price: p.price, ListPrice: p.listPrice, Stock: p.stock, LowStockAt: p.lowStockAt,
    Rating: p.rating, Reviews: p.reviews, ImageUrl: p.imageUrl, Art: p.art, Hue: p.hue,
    AgeRestricted: p.ageRestricted,
    TagsJson: JSON.stringify(p.tags ?? []),
    BulletsJson: JSON.stringify(p.bullets ?? []),
    Description: p.description, CreatedAt: p.createdAt, UpdatedAt: p.updatedAt,
  }))));

  parts.push(insert('StoreLocations', stores.map((s) => ({
    Id: s.id, Name: s.name, Address: s.address, City: s.city, Phone: s.phone,
    Lat: s.lat, Lng: s.lng, RadiusMiles: s.radiusMiles, Hours: s.hours,
  }))));

  parts.push(insert('FuelPrices', fuelPrices.map((f) => ({
    Id: f.id, StoreId: f.storeId, Grade: f.grade, Price: f.price,
  }))));

  parts.push(insert('HeroSlides', heroSlides.map((h) => ({
    Id: h.id, SortOrder: h.sortOrder, Eyebrow: h.eyebrow, Title: h.title, Blurb: h.blurb,
    BadgeBig: h.badgeBig, BadgeSmall: h.badgeSmall, CtaLabel: h.ctaLabel, CtaHref: h.ctaHref,
    Accent: h.accent,
    TileImagesJson: JSON.stringify(h.tileImages ?? []),
    FallbackArtJson: JSON.stringify(h.fallbackArt ?? []),
    Active: h.active, CreatedAt: h.createdAt, UpdatedAt: h.updatedAt,
  }))));

  parts.push(insert('ShowcaseCards', showcaseCards.map((c) => ({
    Id: c.id, SortOrder: c.sortOrder, Title: c.title, LinkLabel: c.linkLabel,
    LinkHref: c.linkHref, Variant: c.variant,
    TilesJson: JSON.stringify(c.tiles ?? []),
    Active: c.active, CreatedAt: c.createdAt, UpdatedAt: c.updatedAt,
  }))));

  parts.push(insert('Deals', deals.map((d) => ({
    Id: d.id, Kind: d.kind, Title: d.title, Detail: d.detail, PercentOff: d.percentOff,
    EndsInHours: d.endsInHours, ImageUrl: d.imageUrl, Active: d.active,
    CreatedAt: d.createdAt, UpdatedAt: d.updatedAt,
  }))));

  parts.push(insert('DealProducts', deals.flatMap((d) =>
    d.products.map((p) => ({ DealsId: d.id, ProductsId: p.id })))));

  parts.push(insert('Orders', orders.map((o) => ({
    Id: o.id, UserId: o.userId, AddressId: o.addressId, Subtotal: o.subtotal,
    DealDiscount: o.dealDiscount, Discount: o.discount, DeliveryFee: o.deliveryFee,
    Tax: o.tax, Total: o.total, Status: o.status, CouponCode: o.couponCode, PlacedAt: o.placedAt,
  }))));

  parts.push(insert('OrderItems', orderItems.map((i) => ({
    Id: i.id, OrderId: i.orderId, ProductId: i.productId, Quantity: i.quantity, UnitPrice: i.unitPrice,
  }))));

  parts.push(insert('Reviews', reviews.map((r) => ({
    Id: r.id, ProductId: r.productId, UserId: r.userId, Rating: r.rating, Title: r.title,
    Body: r.body, VerifiedPurchase: r.verifiedPurchase, CreatedAt: r.createdAt, UpdatedAt: r.updatedAt,
  }))));

  parts.push(insert('PasswordResetTokens', resetTokens.map((t) => ({
    Id: t.id, UserId: t.userId, TokenHash: t.tokenHash, ExpiresAt: t.expiresAt,
    UsedAt: t.usedAt, CreatedAt: t.createdAt,
  }))));

  parts.push('', 'COMMIT;', 'SET FOREIGN_KEY_CHECKS = 1;', '');

  writeFileSync(OUT, parts.join('\n'), 'utf8');

  const withPhoto = products.filter((p) => p.imageUrl).length;
  const deptPhoto = departments.filter((d) => d.imageUrl).length;
  const dealPhoto = deals.filter((d) => d.imageUrl).length;

  console.log(`Wrote ${OUT}`);
  console.log('');
  console.log('  departments   ', departments.length, `(${deptPhoto} with a photo)`);
  console.log('  categories    ', categories.length);
  console.log('  products      ', products.length, `(${withPhoto} with a photo)`);
  console.log('  users         ', users.length);
  console.log('  addresses     ', addresses.length);
  console.log('  stores        ', stores.length);
  console.log('  fuel prices   ', fuelPrices.length);
  console.log('  hero slides   ', heroSlides.length);
  console.log('  showcase cards', showcaseCards.length);
  console.log('  deals         ', deals.length, `(${dealPhoto} with a photo)`);
  console.log('  orders        ', orders.length);
  console.log('  order items   ', orderItems.length);
  console.log('  reviews       ', reviews.length);
  console.log('  reset tokens  ', resetTokens.length);

  if (warnings.length > 0) {
    console.log('');
    console.log('Values too long for their MySQL column — widen these before loading:');
    for (const w of new Set(warnings)) console.log('  ' + w);
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
