import { randomBytes } from 'crypto';
import { readdirSync, rmSync, statSync } from 'fs';
import { extname } from 'path';
import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../../generated/prisma/client';
import { join } from 'path';
import { Logger } from '@nestjs/common';
import { UPLOADS_DIR } from './uploads.constants';
import { cutOutBackdrop, normaliseToWhite } from './normalise-image';

/** Only these are accepted — the extension is derived from the MIME type. */
const ALLOWED = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/avif', '.avif'],
  ['image/gif', '.gif'],
]);

const MAX_BYTES = 5 * 1024 * 1024;

@Controller('uploads')
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  /**
   * Every photograph already sitting in the uploads folder, newest first.
   *
   * A file on disk outlives the row that pointed at it — a product deleted or a
   * database rebuilt leaves the image orphaned but perfectly good. This lets the
   * admin re-attach one by picking it, rather than having to find the original
   * file again on whatever machine it was uploaded from.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('library')
  library() {
    let names: string[] = [];
    try {
      names = readdirSync(UPLOADS_DIR);
    } catch {
      /* No uploads folder yet — an empty library, not an error. */
      return [];
    }

    const servable = new Set(ALLOWED.values());

    return names
      .filter((name) => servable.has(extname(name).toLowerCase()))
      .map((name) => {
        const stat = statSync(join(UPLOADS_DIR, name));
        return {
          url: `/uploads/${name}`,
          size: stat.size,
          modified: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.modified.localeCompare(a.modified));
  }

  /**
   * Accepts one product photograph and returns the public path to store on the
   * product.
   *
   * The stored filename is generated rather than taken from the upload. A
   * client-supplied name is untrusted input: it can carry path separators to
   * escape the uploads folder, or a double extension that gets served back as
   * something executable. Generating the name from random bytes and choosing
   * the extension from the sniffed MIME type removes both problems, and the
   * originals are not needed for anything.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('product-image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_BYTES, files: 1 },
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
          const ext =
            ALLOWED.get(file.mimetype) ??
            extname(file.originalname).toLowerCase();
          cb(
            null,
            `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}${ext}`,
          );
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED.has(file.mimetype)) {
          cb(
            new BadRequestException(
              'Only JPG, PNG, WebP, AVIF or GIF images are allowed',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadProductImage(
    @UploadedFile() file?: Express.Multer.File,
    @Query('mode') mode?: string,
  ) {
    if (!file) throw new BadRequestException('No file was received');

    const source = join(UPLOADS_DIR, file.filename);

    /*
     * Two destinations need opposite treatment, so the caller says which.
     *
     *   white  — a product photograph in the catalogue, which sits on a white
     *            card. The default.
     *   cutout — artwork for a hero tile or a showcase card, which sits on a
     *            coloured panel. A white rectangle there reads as a sticker
     *            stuck onto the slide rather than as the product.
     *
     * Both are applied here rather than at render time because a background is
     * opaque pixels once uploaded — CSS cannot reach it.
     *
     * A failure is deliberately not fatal: the upload already succeeded, and an
     * unprocessed photo is worth far more to the shop than a rejected one, so
     * the file is kept as-is and the reason returned for the admin to see.
     */
    let url = `/uploads/${file.filename}`;
    let normalised = 'left as uploaded';

    try {
      if (mode === 'cutout') {
        /* Alpha needs a PNG container, so the cut-out is a new file and the
           original is removed once it has been replaced. */
        const pngName = `${file.filename.slice(0, -extname(file.filename).length)}.png`;
        const target = join(UPLOADS_DIR, pngName);
        const result = await cutOutBackdrop(source, target);

        if (result.changed) {
          url = `/uploads/${pngName}`;
          normalised = result.reason;
          if (pngName !== file.filename) rmSync(source, { force: true });
        } else {
          /* Not separable — fall back to a white backdrop, which at least
             looks deliberate rather than leaving whatever it arrived with. */
          const fallback = await normaliseToWhite(source);
          normalised = `${result.reason}; used a white background instead`;
          if (!fallback.changed) normalised = result.reason;
        }
      } else {
        const result = await normaliseToWhite(source);
        normalised = result.reason;
      }
    } catch (err) {
      this.logger.warn(
        `Could not process ${file.filename}: ${err instanceof Error ? err.message : err}`,
      );
    }

    return { url, size: file.size, normalised };
  }
}
