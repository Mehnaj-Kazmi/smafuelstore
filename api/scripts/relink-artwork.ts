import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../generated/prisma/client';

/**
 * Re-attaches the cut-out artwork to the hero tiles, showcase card tiles and
 * department circles.
 *
 * These slots each already name the illustration they fall back to — `art` on a
 * showcase tile or a department, `fallbackArt` per position on a hero slide —
 * so a photograph is matched to a slot by that key rather than by position.
 * Anything without a matching photo keeps its drawn artwork, and any slot an
 * admin has already filled by hand is left untouched.
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** art key -> background-removed upload */
const ART_PHOTOS: Record<string, string> = {
  coffee: '/uploads/ms5nikk4-9ad8abe356c8d889-cutout.png',
  donut: '/uploads/ms5ngdoh-0cf0e8e9c7431dd6-cutout.png',
  soda: '/uploads/ms5ngvp0-31a7f5c5286c700f-cutout.png',
  chips: '/uploads/ms5nh0sg-9363e00a096632c0-cutout.png',
  sandwich: '/uploads/ms5nh59i-f4b454d93f4a3325-cutout.png',
  muffin: '/uploads/ms5nh827-81949decadc67532-cutout.png',
  eggs: '/uploads/ms5nhbdt-27a4be1899fd4284-cutout.png',
  bread: '/uploads/ms5nhjm9-5d14f6a06bfa3b9d-cutout.png',
  chocolate: '/uploads/ms5ni9uc-8f5b770180dd64e6-cutout.png',
  jerky: '/uploads/ms5nfjwm-c93e277d14285697-cutout.png',
  phoneCharger: '/uploads/ms5nfthr-7fb5646692871dd4-cutout.png',
  coolant: '/uploads/ms5ng3h3-457624c903f59ffd-cutout.png',
  petFood: '/uploads/ms5nicw4-7be41acb5ae9fea0-cutout.png',
  petTreat: '/uploads/ms5nifnh-088d2cee7d641e4d-cutout.png',
};

type Tile = { label: string; href: string; imageUrl?: string | null; art: string; hue: number };

async function main() {
  /* ---- Hero slides ---------------------------------------------------- */
  let heroTiles = 0;
  for (const slide of await prisma.heroSlide.findMany()) {
    const next = slide.fallbackArt.map((art, i) => {
      const already = slide.tileImages[i];
      if (already) return already;
      const photo = ART_PHOTOS[art];
      if (photo) heroTiles += 1;
      return photo ?? '';
    });

    if (next.some((url, i) => url !== (slide.tileImages[i] ?? ''))) {
      await prisma.heroSlide.update({ where: { id: slide.id }, data: { tileImages: next } });
    }
  }

  /* ---- Showcase cards -------------------------------------------------- */
  let cardTiles = 0;
  for (const card of await prisma.showcaseCard.findMany()) {
    const tiles = card.tiles as unknown as Tile[];
    if (!Array.isArray(tiles)) continue;

    let touched = false;
    const next = tiles.map((tile) => {
      if (tile.imageUrl) return tile;
      const photo = ART_PHOTOS[tile.art];
      if (!photo) return tile;
      touched = true;
      cardTiles += 1;
      return { ...tile, imageUrl: photo };
    });

    if (touched) {
      await prisma.showcaseCard.update({
        where: { id: card.id },
        data: { tiles: next as unknown as Prisma.InputJsonValue },
      });
    }
  }

  /* ---- Department circles ---------------------------------------------- */
  let departments = 0;
  for (const dept of await prisma.department.findMany()) {
    if (dept.imageUrl) continue;
    const photo = ART_PHOTOS[dept.art];
    if (!photo) continue;
    await prisma.department.update({ where: { slug: dept.slug }, data: { imageUrl: photo } });
    departments += 1;
  }

  console.log(`  hero tiles filled:      ${heroTiles}`);
  console.log(`  showcase tiles filled:  ${cardTiles}`);
  console.log(`  department circles:     ${departments}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
