import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { UPLOADS_DIR } from './uploads/uploads.constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  /*
   * Uploaded product photographs, served straight from disk.
   *
   * Registered after setGlobalPrefix on purpose: the prefix applies to
   * controllers, not to static assets, so these stay at /uploads/<file> rather
   * than moving under /api. The upload endpoint returns that same path, so the
   * two must agree.
   */
  app.useStaticAssets(UPLOADS_DIR, {
    prefix: '/uploads/',
    index: false,
    /*
     * Short freshness window rather than the year an immutable asset would get.
     *
     * Filenames are unique per upload, so caching hard would normally be safe.
     * But images can be rewritten in place — the upload endpoint normalises
     * backgrounds, and the backfill script reprocesses existing files — and a
     * year-long cache means browsers keep showing the old version of a path
     * they have already seen, with no request to discover otherwise. Five
     * minutes plus the ETag express-static sends means repeat views still hit
     * cache and a changed image corrects itself, cheaply, on its own.
     */
    maxAge: '5m',
    etag: true,
    lastModified: true,
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
