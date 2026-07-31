import { renameSync, rmSync } from 'fs';
import sharp from 'sharp';

/*
 * sharp keeps decoded inputs in an internal cache, which on Windows can hold a
 * handle to the source file open. Writing a processed image back over its own
 * path then fails with EINVAL. Disabling the cache plus the temp-file rename in
 * writeBack together make overwriting in place reliable.
 */
sharp.cache(false);

/** How far a pixel may differ from the sampled backdrop and still count as it. */
const COLOUR_TOLERANCE = 34;

/**
 * Share of the centre of the frame that may be filled before the result is
 * discarded.
 *
 * A backdrop and a product that are close in colour cannot be told apart
 * reliably, and the failure is severe: the fill consumes the product and leaves
 * a white frame holding fragments of labelling.
 *
 * Total fill size is a poor test for this — a small item on a large backdrop
 * legitimately fills most of the frame, so any threshold low enough to catch
 * the damaging case also rejects perfectly good photographs. What actually
 * separates the two is *where* the fill reached: products sit in the middle of
 * a product shot, so a fill that has eaten into the centre has gone wrong no
 * matter how much of the total it covers.
 */
const MAX_CENTRE_FILL = 0.35;

/** Side of the central sample box, as a fraction of each dimension. */
const CENTRE_BOX = 0.3;

/** Border must be at least this uniform before its colour is treated as a backdrop. */
const MAX_BORDER_SPREAD = 42;

/** Backdrops lighter than this are already close enough to white to leave alone. */
const ALREADY_LIGHT = 232;

export type NormaliseResult = {
  changed: boolean;
  reason: string;
  /** Sampled backdrop colour, when one was found. */
  backdrop?: [number, number, number];
};

function dist(a: number[], b: number[]): number {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2,
  );
}

/**
 * Puts a product photograph on a white background.
 *
 * Two separate problems are handled:
 *
 *   1. Transparency. A cut-out PNG has no background at all, so it takes on
 *      whatever sits behind it — on a dark page that reads as black. Flattening
 *      onto white bakes in the intended look.
 *
 *   2. A coloured studio backdrop. Photographed on dark grey or black, the
 *      backdrop is opaque pixels and no amount of CSS changes it.
 *
 * The second is only attempted when the border is confidently uniform, and the
 * replacement is a flood fill inward from the edges rather than a global colour
 * swap. That distinction is what makes it safe: a global swap would also wipe
 * out dark pixels *inside* the product — the shadowed side of a black can would
 * be punched full of white holes. A fill that can only travel from the border
 * through matching pixels stops at the product outline.
 *
 * When the border is not uniform (a lifestyle shot, a gradient, a background
 * the product bleeds into) nothing is replaced and the photo is left as-is,
 * because guessing wrong is far more damaging than leaving a dark backdrop.
 */
export async function normaliseToWhite(file: string): Promise<NormaliseResult> {
  const input = sharp(file, { failOn: 'none' });
  const meta = await input.metadata();
  if (!meta.width || !meta.height)
    return { changed: false, reason: 'unreadable' };

  // Flatten any transparency onto white first, so the fill sees final colours.
  const flattened = await sharp(file, { failOn: 'none' })
    .flatten({ background: '#ffffff' })
    .toColourspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = flattened;
  const { width: w, height: h, channels } = info;

  /* Sample the border to decide whether there is a uniform backdrop. */
  const samples: number[][] = [];
  const step = Math.max(1, Math.floor(Math.min(w, h) / 60));
  const at = (x: number, y: number) => {
    const i = (y * w + x) * channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  for (let x = 0; x < w; x += step) {
    samples.push(at(x, 0), at(x, h - 1));
  }
  for (let y = 0; y < h; y += step) {
    samples.push(at(0, y), at(w - 1, y));
  }

  const mean = [0, 1, 2].map(
    (c) => samples.reduce((s, p) => s + p[c], 0) / samples.length,
  );
  const spread =
    samples.reduce((s, p) => s + dist(p, mean), 0) / samples.length;

  if (spread > MAX_BORDER_SPREAD) {
    // Busy border — a lifestyle shot rather than a studio cut-out.
    if (meta.hasAlpha) {
      await writeBack(file, data, info, meta.format);
      return { changed: true, reason: 'flattened transparency onto white' };
    }
    return {
      changed: false,
      reason: 'background is not uniform — left untouched',
    };
  }

  const backdrop: [number, number, number] = [
    Math.round(mean[0]),
    Math.round(mean[1]),
    Math.round(mean[2]),
  ];

  const luma =
    0.2126 * backdrop[0] + 0.7152 * backdrop[1] + 0.0722 * backdrop[2];
  if (luma >= ALREADY_LIGHT) {
    if (meta.hasAlpha) {
      await writeBack(file, data, info, meta.format);
      return {
        changed: true,
        reason: 'flattened transparency onto white',
        backdrop,
      };
    }
    return { changed: false, reason: 'backdrop already white', backdrop };
  }

  /*
   * Flood fill inward from the border.
   *
   * Comparisons use a snapshot of the original pixels, because the fill
   * overwrites as it goes — judging a candidate against an already-whitened
   * neighbour would let the fill march straight through the product.
   */
  const orig = Buffer.from(data);
  const seen = new Uint8Array(w * h);
  const queue: number[] = [];

  const colourAt = (idx: number) => {
    const i = idx * channels;
    return [orig[i], orig[i + 1], orig[i + 2]];
  };

  /*
   * Takes no neighbour to compare against, deliberately.
   *
   * Judged against the sampled backdrop only, never against the pixel it spread
   * from. Neighbour-relative growing follows a gradient nicely, but when the
   * product is a similar colour to its backdrop — a black can on near-black
   * seamless — each step stays within tolerance of the last and the fill eats
   * the product, leaving only its lighter labelling behind. Anchoring every
   * comparison to one colour keeps the fill contained.
   */
  const consider = (x: number, y: number) => {
    const idx = y * w + x;
    if (seen[idx]) return;

    if (dist(colourAt(idx), backdrop) > COLOUR_TOLERANCE) return;

    seen[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < w; x++) {
    consider(x, 0);
    consider(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    consider(0, y);
    consider(w - 1, y);
  }

  let filled = 0;
  while (queue.length) {
    const idx = queue.pop() as number;
    const x = idx % w;
    const y = (idx / w) | 0;
    const i = idx * channels;
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    filled++;

    if (x > 0) consider(x - 1, y);
    if (x < w - 1) consider(x + 1, y);
    if (y > 0) consider(x, y - 1);
    if (y < h - 1) consider(x, y + 1);
  }

  const share = filled / (w * h);
  if (share < 0.02) {
    return { changed: false, reason: 'no contiguous backdrop found', backdrop };
  }

  /* Did the fill reach the middle of the frame, where the product should be? */
  const x0 = Math.floor(w * (0.5 - CENTRE_BOX / 2));
  const x1 = Math.ceil(w * (0.5 + CENTRE_BOX / 2));
  const y0 = Math.floor(h * (0.5 - CENTRE_BOX / 2));
  const y1 = Math.ceil(h * (0.5 + CENTRE_BOX / 2));

  let centreFilled = 0;
  let centreTotal = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      centreTotal++;
      if (seen[y * w + x]) centreFilled++;
    }
  }

  const centreShare = centreTotal ? centreFilled / centreTotal : 0;
  if (centreShare > MAX_CENTRE_FILL) {
    return {
      changed: false,
      reason: `backdrop too close to the product (fill reached ${(centreShare * 100).toFixed(0)}% of the centre) — left untouched`,
      backdrop,
    };
  }

  await writeBack(file, data, info, meta.format);
  return {
    changed: true,
    reason: `replaced ${(share * 100).toFixed(0)}% backdrop with white`,
    backdrop,
  };
}

/**
 * Cuts a uniform backdrop out of a photograph, leaving it transparent.
 *
 * The mirror image of `normaliseToWhite`: the same border-uniformity test and
 * the same flood fill from the edges, but the matched pixels are made
 * transparent rather than white, and the result is written as PNG because JPEG
 * cannot carry an alpha channel.
 *
 * Used for artwork that sits on a coloured panel — a hero tile on a green or
 * red slide — where a white rectangle around the product would read as a
 * sticker rather than as the product itself.
 *
 * Returns the path of the new file, or null when the photo is not separable.
 * The same centre-of-frame guard applies: rather than risk punching holes
 * through a pale product, an unclear photo is left alone.
 */
export async function cutOutBackdrop(
  file: string,
  outFile: string,
): Promise<NormaliseResult> {
  const meta = await sharp(file, { failOn: 'none' }).metadata();
  if (!meta.width || !meta.height)
    return { changed: false, reason: 'unreadable' };

  const { data, info } = await sharp(file, { failOn: 'none' })
    .flatten({ background: '#ffffff' })
    .ensureAlpha()
    .toColourspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h, channels } = info;
  const at = (x: number, y: number) => {
    const i = (y * w + x) * channels;
    return [data[i], data[i + 1], data[i + 2]];
  };

  const samples: number[][] = [];
  const step = Math.max(1, Math.floor(Math.min(w, h) / 60));
  for (let x = 0; x < w; x += step) samples.push(at(x, 0), at(x, h - 1));
  for (let y = 0; y < h; y += step) samples.push(at(0, y), at(w - 1, y));

  const mean = [0, 1, 2].map(
    (c) => samples.reduce((s, p) => s + p[c], 0) / samples.length,
  );
  const spread =
    samples.reduce((s, p) => s + dist(p, mean), 0) / samples.length;
  if (spread > MAX_BORDER_SPREAD) {
    return {
      changed: false,
      reason: 'background is not uniform — left untouched',
    };
  }

  const backdrop: [number, number, number] = [
    Math.round(mean[0]),
    Math.round(mean[1]),
    Math.round(mean[2]),
  ];

  const orig = Buffer.from(data);
  const seen = new Uint8Array(w * h);
  const queue: number[] = [];

  const consider = (x: number, y: number) => {
    const idx = y * w + x;
    if (seen[idx]) return;
    const i = idx * channels;
    if (dist([orig[i], orig[i + 1], orig[i + 2]], backdrop) > COLOUR_TOLERANCE)
      return;
    seen[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < w; x++) {
    consider(x, 0);
    consider(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    consider(0, y);
    consider(w - 1, y);
  }

  let filled = 0;
  while (queue.length) {
    const idx = queue.pop() as number;
    const x = idx % w;
    const y = (idx / w) | 0;
    data[idx * channels + 3] = 0;
    filled++;

    if (x > 0) consider(x - 1, y);
    if (x < w - 1) consider(x + 1, y);
    if (y > 0) consider(x, y - 1);
    if (y < h - 1) consider(x, y + 1);
  }

  if (filled / (w * h) < 0.02) {
    return { changed: false, reason: 'no contiguous backdrop found', backdrop };
  }

  const x0 = Math.floor(w * (0.5 - CENTRE_BOX / 2));
  const x1 = Math.ceil(w * (0.5 + CENTRE_BOX / 2));
  const y0 = Math.floor(h * (0.5 - CENTRE_BOX / 2));
  const y1 = Math.ceil(h * (0.5 + CENTRE_BOX / 2));

  let centreFilled = 0;
  let centreTotal = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      centreTotal++;
      if (seen[y * w + x]) centreFilled++;
    }
  }
  const centreShare = centreTotal ? centreFilled / centreTotal : 0;
  if (centreShare > MAX_CENTRE_FILL) {
    return {
      changed: false,
      reason: `product too close in colour to its backdrop (fill reached ${(centreShare * 100).toFixed(0)}% of the centre) — left untouched`,
      backdrop,
    };
  }

  const tmp = `${outFile}.tmp`;
  try {
    await sharp(data, { raw: { width: w, height: h, channels: 4 } })
      .png()
      .toFile(tmp);
    renameSync(tmp, outFile);
  } catch (err) {
    rmSync(tmp, { force: true });
    throw err;
  }

  return {
    changed: true,
    reason: `cut out ${((filled / (w * h)) * 100).toFixed(0)}% backdrop`,
    backdrop,
  };
}

async function writeBack(
  file: string,
  data: Buffer,
  info: { width: number; height: number; channels: number },
  format?: string,
) {
  const pipeline = sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels as 3 | 4,
    },
  });

  /* Keep the original container so the stored filename stays truthful. */
  const out =
    format === 'png'
      ? pipeline.png()
      : format === 'webp'
        ? pipeline.webp({ quality: 90 })
        : format === 'avif'
          ? pipeline.avif({ quality: 60 })
          : pipeline.jpeg({ quality: 90 });

  const buf = await out.toBuffer();

  /* Write beside the original and swap, so a failure part-way through cannot
     leave a half-written image where a working one used to be. */
  const tmp = `${file}.tmp`;
  try {
    await sharp(buf).toFile(tmp);
    renameSync(tmp, file);
  } catch (err) {
    rmSync(tmp, { force: true });
    throw err;
  }
}
