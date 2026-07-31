import { mkdirSync } from 'fs';
import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UPLOADS_DIR } from './uploads.constants';

/**
 * Product image uploads.
 *
 * The destination folder is created at module load. Multer's diskStorage does
 * not create a missing destination — it fails the request instead — so a fresh
 * clone would reject every upload until someone made the folder by hand.
 */
@Module({ controllers: [UploadsController] })
export class UploadsModule {
  constructor() {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}
