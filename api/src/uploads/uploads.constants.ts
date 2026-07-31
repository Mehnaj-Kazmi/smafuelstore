import { join } from 'path';

/**
 * Where uploaded product photographs live on disk.
 *
 * Resolved from the process working directory rather than `__dirname` so the
 * path is the same whether the API runs from `src` under nest start or from
 * the compiled `dist` — otherwise images written in development would vanish
 * from a production build's view of the folder.
 */
export const UPLOADS_DIR = join(process.cwd(), 'uploads');
