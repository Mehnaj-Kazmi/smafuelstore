import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { UPLOADS_DIR } from '../src/uploads/uploads.constants';
import { normaliseToWhite } from '../src/uploads/normalise-image';

/**
 * Applies the white-background treatment to photographs that were uploaded
 * before it existed. New uploads are handled by the upload endpoint itself.
 *
 * Originals are copied to uploads/.originals first. The processing is lossy and
 * irreversible — a flood fill cannot be undone — so keeping the untouched file
 * means a bad result can be restored rather than needing a re-upload.
 *
 * Run with:  npx tsx scripts/normalise-existing-uploads.ts
 */
/*
 * Kept beside the uploads folder rather than inside it. Everything under
 * uploads/ is served statically, so a backup nested there would publish the
 * un-processed originals at guessable URLs — the dark-background versions this
 * script exists to replace.
 */
const BACKUP_DIR = join(UPLOADS_DIR, '..', 'uploads-originals');

async function main() {
  if (!existsSync(UPLOADS_DIR)) {
    console.log('No uploads folder yet — nothing to do.');
    return;
  }
  mkdirSync(BACKUP_DIR, { recursive: true });

  const files = readdirSync(UPLOADS_DIR).filter((f) =>
    /\.(jpe?g|png|webp|avif|gif)$/i.test(f),
  );

  let changed = 0;
  for (const name of files) {
    const path = join(UPLOADS_DIR, name);
    const backup = join(BACKUP_DIR, name);

    if (!existsSync(backup)) copyFileSync(path, backup);

    try {
      const result = await normaliseToWhite(path);
      if (result.changed) changed++;
      const tag = result.changed ? 'CHANGED' : 'skipped';
      const bg = result.backdrop ? ` bg=rgb(${result.backdrop.join(',')})` : '';
      console.log(`  ${tag.padEnd(8)} ${name.padEnd(42)} ${result.reason}${bg}`);
    } catch (err) {
      console.log(
        `  FAILED   ${name.padEnd(42)} ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  console.log(`\n${changed} of ${files.length} image(s) changed.`);
  console.log(`Originals kept in ${BACKUP_DIR}`);
}

void main();
