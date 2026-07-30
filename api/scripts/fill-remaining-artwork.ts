import { existsSync } from 'fs';
import { basename, extname, join } from 'path';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../generated/prisma/client';
import { UPLOADS_DIR } from '../src/uploads/uploads.constants';
import { cutOutBackdrop } from '../src/uploads/normalise-image';

/**
 * Fills the hero tiles, showcase tiles and department circles still showing
 * drawn artwork.
 *
 * The first pass could only use images that had already been background-removed.
 * Most of the remaining slots do have a suitable photograph — it just has the
 * white backdrop a catalogue shot wants and a tile does not. So the cut-out is
 * generated here from the product photo, once per source file, and reused
 * wherever that art key appears.
 *
 * Slots with no matching photograph keep their illustration, and anything an
 * admin has already set by hand is left alone.
 *
 * Run with:  npx tsx scripts/fill-remaining-artwork.ts
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** art key -> source product photo to cut out */
const SOURCES: Record<string, string> = {
  juice: 'ms4hw3tk-8b9a65157fdb7e5e.avif',
  gum: 'ms4hs4t2-0025d115bef24095.jpg',
  milk: 'ms4hl090-ab877d728df98901.png',
  cleaner: 'ms4hbtgl-eec600ae7566b29c.jpg',
  paperTowel: 'ms4hawtm-c383f3066bb09aaa.jpg',
  battery: 'ms4ha23k-b13e93d04c43a9ec.jpg',
  pills: 'ms5nmxol-9132e997785cd2a1.jpg',
  bandage: 'ms4h5wsi-0a275e5a9a3921d6.jpg',
  sanitizer: 'ms4h4s9h-ec62a4b699e3d568.webp',
  toothpaste: 'ms4h3lgw-cdee30c252d4096d.jpg',
  wiper: 'ms4hh4cp-a4ff3b10d3703e8a.avif',
  cigarettes: 'ms4h2gdk-8cda17ed29d95787.avif',
  energy: 'ms4hy5i9-8a978a7475485b03.jpg',
  candy: 'ms4hv6nm-e5b7b199fc627760.webp',
  hotdog: 'ms4hpps7-9aa9d3a9d046e82a.jpg',
  nuts: 'ms4hsxn3-c77fb1b5db810475.jpg',
  /* The grocery circle asks for `cereal`, which nothing depicts; the sliced loaf
     is the closest honest stand-in for a grocery aisle. */
  cereal: 'ms5nhjm9-5d14f6a06bfa3b9d-cutout.png',
};

type Tile = { label: string; href: string; imageUrl?: string | null; art: string; hue: number };

/** Cuts a source photo out once and returns its public path, or null if it cannot. */
const cache = new Map<string, string | null>();

async function cutoutFor(art: string): Promise<string | null> {
  const source = SOURCES[art];
  if (!source) return null;
  if (cache.has(art)) return cache.get(art)!;

  /* Already transparent — use as-is rather than cutting a cut-out. */
  if (source.endsWith('-cutout.png')) {
    const url = `/uploads/${source}`;
    cache.set(art, url);
    return url;
  }

  const src = join(UPLOADS_DIR, source);
  if (!existsSync(src)) {
    console.log(`  MISSING  ${source} (for ${art})`);
    cache.set(art, null);
    return null;
  }

  const outName = `${basename(source).slice(0, -extname(source).length)}-cutout.png`;
  const out = join(UPLOADS_DIR, outName);
  const url = `/uploads/${outName}`;

  if (existsSync(out)) {
    cache.set(art, url);
    return url;
  }

  /*
   * A refused cut-out still leaves a usable photograph.
   *
   * Background removal declines when the product is close in colour to its own
   * white backdrop — a white bottle, a pale carton. Those keep their white
   * background, which is exactly what ProductImage draws behind a photo anyway,
   * so the original is used and only the transparency is lost. A real photo on
   * white beats a drawn placeholder.
   */
  const original = `/uploads/${source}`;

  try {
    const result = await cutOutBackdrop(src, out);
    if (!result.changed) {
      console.log(`  as-is     ${art.padEnd(14)} ${result.reason.split('—')[0].trim()}`);
      cache.set(art, original);
      return original;
    }
    console.log(`  cut out   ${art.padEnd(14)} ${outName}`);
    cache.set(art, url);
    return url;
  } catch (err) {
    console.log(`  as-is     ${art.padEnd(14)} ${err instanceof Error ? err.message : err}`);
    cache.set(art, original);
    return original;
  }
}

async function main() {
  let heroTiles = 0;
  for (const slide of await prisma.heroSlide.findMany()) {
    const next = [...slide.tileImages];
    let touched = false;

    for (let i = 0; i < slide.fallbackArt.length; i++) {
      if (next[i]) continue;
      const url = await cutoutFor(slide.fallbackArt[i]);
      if (!url) {
        next[i] = next[i] ?? '';
        continue;
      }
      next[i] = url;
      touched = true;
      heroTiles += 1;
    }

    if (touched) {
      await prisma.heroSlide.update({ where: { id: slide.id }, data: { tileImages: next } });
    }
  }

  let cardTiles = 0;
  for (const card of await prisma.showcaseCard.findMany()) {
    const tiles = card.tiles as unknown as Tile[];
    if (!Array.isArray(tiles)) continue;

    let touched = false;
    const next: Tile[] = [];
    for (const tile of tiles) {
      if (tile.imageUrl) {
        next.push(tile);
        continue;
      }
      const url = await cutoutFor(tile.art);
      if (!url) {
        next.push(tile);
        continue;
      }
      next.push({ ...tile, imageUrl: url });
      touched = true;
      cardTiles += 1;
    }

    if (touched) {
      await prisma.showcaseCard.update({
        where: { id: card.id },
        data: { tiles: next as unknown as Prisma.InputJsonValue },
      });
    }
  }

  let departments = 0;
  for (const dept of await prisma.department.findMany()) {
    if (dept.imageUrl) continue;
    const url = await cutoutFor(dept.art);
    if (!url) continue;
    await prisma.department.update({ where: { slug: dept.slug }, data: { imageUrl: url } });
    departments += 1;
  }

  console.log(`\n  hero tiles filled:     ${heroTiles}`);
  console.log(`  showcase tiles filled: ${cardTiles}`);
  console.log(`  department circles:    ${departments}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
