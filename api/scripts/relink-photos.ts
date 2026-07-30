import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Re-attaches uploaded photographs to the products and deals they belong to.
 *
 * The `imageUrl` columns were lost when the database was rebuilt for the
 * integer-id migration, but the files themselves survived in `api/uploads`.
 * Each pairing below was made by looking at the image and matching it to the
 * product it depicts, so this is a recovery step rather than a seed — it runs
 * once and is safe to re-run, since it only ever sets the same value again.
 *
 * Anything already carrying a photo is left alone, so a picture chosen by hand
 * in the admin panel is never overwritten by this list.
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** sku -> uploaded filename */
const PRODUCT_PHOTOS: Record<string, string> = {
  'DRK-SOD-001': 'ms4hz4dr-449405b703c9f5df.jpg', // Cascade can
  'DRK-ENG-002': 'ms4hy5i9-8a978a7475485b03.jpg', // Voltrix energy drink
  'DRK-COF-004': 'ms4hwqbu-17b2a592e01eb7cc.webp', // Fresh Brew coffee
  'DRK-JCE-005': 'ms4hw3tk-8b9a65157fdb7e5e.avif', // orange juice carton
  'SNK-CHP-006': 'ms4gd5yc-cd7d384fedb60b8d.jpg', // potato chips
  'SNK-CND-007': 'ms4hv6nm-e5b7b199fc627760.webp', // chocolate bar
  'SNK-JRK-008': 'ms4hu09r-f7dfdb2c4a7191c0.jpg', // beef jerky
  'SNK-NUT-009': 'ms4hsxn3-c77fb1b5db810475.jpg', // mixed nuts
  'SNK-GUM-010': 'ms4hs4t2-0025d115bef24095.jpg', // spearmint gum
  'BAK-DNT-011': 'ms4hrdh4-423140c69633459b.webp', // glazed donut
  'BAK-SND-012': 'ms4hqfri-782109e109a7af7c.webp', // breakfast sandwich
  'BAK-HTD-013': 'ms4hpps7-9aa9d3a9d046e82a.jpg', // hot dog
  'BAK-MUF-014': 'ms4hoj5i-8177eda429ae5834.jpg', // blueberry muffin
  'GRO-DRY-015': 'ms4hl090-ab877d728df98901.png', // whole milk
  'GRO-DRY-016': 'ms4hkb9y-af5494a46ffd6de3.webp', // egg carton
  'GRO-BRD-017': 'ms4hjp9r-fbbd4232e09cb09d.jpg', // sliced bread (confirmed pre-wipe)
  'GRO-PAN-018': 'ms4hj0aw-b1095fa80886b8c6.webp', // instant ramen
  'GRO-FRZ-019': 'ms4hi7l2-09e16fb35f9bbe60.jpg', // vanilla ice cream
  'AUT-WIP-021': 'ms4hh4cp-a4ff3b10d3703e8a.avif', // wiper blade
  'AUT-FLD-022': 'ms4i6qio-036846ec15f65358.webp', // washer fluid
  'AUT-ACC-023': 'ms4hdwre-14868edc98423ac1.webp', // USB-C car charger
  'AUT-ACC-024': 'ms4hcznm-1fa872898833d4bf.jpg', // Black Ice air freshener
  'HOU-CLN-025': 'ms4hbtgl-eec600ae7566b29c.jpg', // multi-surface cleaner
  'HOU-PPR-026': 'ms4hawtm-c383f3066bb09aaa.jpg', // paper towel 6-roll
  'HOU-BAT-027': 'ms4ha23k-b13e93d04c43a9ec.jpg', // AA batteries 8-pack
  'HOU-DET-028': 'ms4h8xhl-fdb49d836e23fdfd.webp', // laundry pods
  'MED-PAI-029': 'ms5nmxol-9132e997785cd2a1.jpg', // ibuprofen
  'MED-FST-030': 'ms4h5wsi-0a275e5a9a3921d6.jpg', // adhesive bandages
  'MED-PER-031': 'ms4h4s9h-ec62a4b699e3d568.webp', // hand sanitiser
  'MED-PER-032': 'ms4h3lgw-cdee30c252d4096d.jpg', // travel toothpaste
  'TOB-CIG-033': 'ms4h2gdk-8cda17ed29d95787.avif', // cigarette pack
  'TOB-LTR-034': 'ms4h04vj-415bf2751fe154fc.jpg', // lighter
  'PET-TRT-036': 'ms4gtyo0-ecd98745c7aa2e54.jpg', // dog dental treats
};

/** deal title -> uploaded filename */
const DEAL_PHOTOS: Record<string, string> = {
  'Coffee & donut for $3': 'ms5mj68s-43cec3cbaef0d7ae.jpg',
  '20% off all energy drinks': 'ms5mgl5d-4bcee158b9f640d8.jpg',
  'Weekend snack bundle — 25% off': 'ms5mez4e-a32830a13e65167f.jpg',
};

async function main() {
  let products = 0;
  let skippedProducts = 0;

  for (const [sku, file] of Object.entries(PRODUCT_PHOTOS)) {
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (!existing) {
      console.warn(`  no product with sku ${sku} — skipped`);
      continue;
    }
    if (existing.imageUrl) {
      skippedProducts += 1;
      continue;
    }
    await prisma.product.update({
      where: { sku },
      data: { imageUrl: `/uploads/${file}` },
    });
    products += 1;
  }

  let deals = 0;
  for (const [title, file] of Object.entries(DEAL_PHOTOS)) {
    const deal = await prisma.deal.findFirst({ where: { title } });
    if (!deal || deal.imageUrl) continue;
    await prisma.deal.update({ where: { id: deal.id }, data: { imageUrl: `/uploads/${file}` } });
    deals += 1;
  }

  const withPhoto = await prisma.product.count({ where: { imageUrl: { not: null } } });
  const total = await prisma.product.count();

  console.log(`  linked ${products} product photo(s), skipped ${skippedProducts} already set`);
  console.log(`  linked ${deals} deal photo(s)`);
  console.log(`  products with a photo: ${withPhoto}/${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
