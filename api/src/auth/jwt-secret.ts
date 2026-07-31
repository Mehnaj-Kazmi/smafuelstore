/**
 * The key every session token is signed with.
 *
 * This used to be `process.env.JWT_SECRET ?? 'dev-secret-change-me'`, written
 * out separately where tokens are signed and where they are verified. A deploy
 * that forgot the variable therefore started perfectly happily and signed real
 * sessions with a string committed to a public repository — and anyone reading
 * it could mint themselves an admin token.
 *
 * So the fallback is now refused in production. Failing to boot is a loud,
 * five-minute problem; booting with a known key is a silent one that ends with
 * someone else's orders. Development still gets a default, because a local
 * checkout should just run.
 */
const DEV_FALLBACK = 'dev-only-insecure-secret';

/*
 * Resolved once and reused.
 *
 * Signing and verification read this from different places at different points
 * in start-up. If the environment were to change in between — or be read before
 * it is loaded — the two would disagree and every token issued would be
 * rejected by the next request. Memoising makes that impossible: whatever the
 * first caller resolves is what the whole process uses.
 */
let cached: string | null = null;

export function resolveJwtSecret(): string {
  if (cached !== null) return cached;
  cached = resolve();
  return cached;
}

function resolve(): string {
  const secret = process.env.JWT_SECRET;

  if (secret && secret.trim().length > 0) {
    /* A short key is brute-forceable offline, where no rate limit can help. */
    if (process.env.NODE_ENV === 'production' && secret.length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters in production. ' +
          'Generate one with:  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"',
      );
    }
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET is not set. Refusing to start in production with a default signing key — ' +
        'anyone who knows it could forge an admin session. Generate one with:  ' +
        'node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"',
    );
  }

  return DEV_FALLBACK;
}
