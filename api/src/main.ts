/*
 * Loaded before anything else on purpose.
 *
 * Nest's ConfigModule only populates process.env once the application module is
 * being constructed, which is *after* every module file has been imported. The
 * JWT secret is read at import time by JwtModule.register, so without this the
 * token signer saw an empty environment and fell back to the development key
 * while the verifier — constructed later — used the real one. Every freshly
 * issued token was then rejected as unauthorised.
 */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { UPLOADS_DIR } from './uploads/uploads.constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /*
   * Response headers that close off whole classes of attack: HSTS, a refusal to
   * be framed, and no MIME sniffing.
   *
   * Two deliberate relaxations. The default Content-Security-Policy is written
   * for a server that renders HTML; this one answers JSON and serves images to
   * a separate Next.js origin, where the storefront's own CSP is what matters —
   * leaving it on only produces console noise about a policy governing nothing.
   * And cross-origin resource policy has to allow the frontend to load product
   * photographs from this port at all, which the `same-origin` default forbids.
   */
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  });
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
/* `void` so the floating promise is deliberate rather than overlooked; a
   failure to start still surfaces as an unhandled rejection and a non-zero
   exit, which is what a process manager needs to see. */
void bootstrap();
