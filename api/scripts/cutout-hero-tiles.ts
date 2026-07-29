import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { basename, extname, join } from 'path';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { UPLOADS_DIR } from '../src/uploads/uploads.constants';
import { cutOutBackdrop } from '../src/uploads/normalise-image';

/**
 * Makes the hero carousel's tile artwork transparent.
 *
 * Hero tiles sit on a coloured slide, so a white rectangle around each product
 * reads as a sticker. Product photographs elsewhere in the shop still want the
 * white backdrop, so this only touches images referenced by a HeroSlide.
 *
 * A cut-out is written as a new .png beside the original rather than replacing
 * it — the original stays valid for any other place that references it, and a
 * disappointing cut-out can be undone by pointing the slide back.
 *
 * Run with:  npx tsx scripts/cutout-hero-tiles.ts
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const BACKUP_DIR = join(UPLOADS_DIR, '..', 'uploads-originals');

async function main() {
  mkdirSync(BACKUP_DIR, { recursive: true });

  const slides = await prisma.heroSlide.findMany({ orderBy: { sortOrder: 'asc' } });
  let changed = 0;
  let skipped = 0;

  for (const slide of slides) {
    const next: string[] = [];

    for (const url of slide.tileImages) {
      if (!url) {
        next.push(url);
        continue;
      }

      const name = basename(url);
      const src = join(UPLOADS_DIR, name);
      if (!existsSync(src)) {
        console.log(`  MISSING  ${name}`);
        next.push(url);
        continue;
      }

      // Keep an untouched copy the first time we see this file.
      const backup = join(BACKUP_DIR, name);
      if (!existsSync(backup)) copyFileSync(src, backup);

      const outName = `${name.slice(0, -extname(name).length)}-cutout.png`;
      const out = join(UPLOADS_DIR, outName);

      try {
        const result = await cutOutBackdrop(src, out);
        if (result.changed) {
          changed++;
          next.push(`/uploads/${outName}`);
          console.log(`  CUT OUT  ${name.padEnd(40)} ${result.reason}`);
        } else {
          skipped++;
          next.push(url);
          console.log(`  skipped  ${name.padEnd(40)} ${result.reason}`);
        }
      } catch (err) {
        skipped++;
        next.push(url);
        console.log(`  FAILED   ${name.padEnd(40)} ${err instanceof Error ? err.message : err}`);
      }
    }

    await prisma.heroSlide.update({ where: { id: slide.id }, data: { tileImages: next } });
  }

  console.log(`\n${changed} cut out, ${skipped} left as-is. Originals in ${BACKUP_DIR}`);
  await prisma.$disconnect();
}

void main();
