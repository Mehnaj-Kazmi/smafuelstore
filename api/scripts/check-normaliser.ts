import { normaliseToWhite } from '../src/uploads/normalise-image';

/**
 * Sanity-checks the background normaliser against known cases.
 *
 * Pass file paths as arguments; each is processed in place and the decision is
 * printed. Intended for tuning, so always run it on copies.
 */
async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.log('usage: npx tsx scripts/check-normaliser.ts <image> [image...]');
    return;
  }
  for (const f of files) {
    try {
      const r = await normaliseToWhite(f);
      console.log(`${f.split(/[\\/]/).pop()?.padEnd(24)} ${JSON.stringify(r)}`);
    } catch (err) {
      console.log(`${f} FAILED ${err instanceof Error ? err.message : err}`);
    }
  }
}

void main();
