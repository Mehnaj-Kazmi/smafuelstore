/**
 * How hard a caller may hammer the sensitive routes.
 *
 * The first attempt at these was far too mean — five registrations an hour and
 * eight sign-in attempts in five minutes — which locked the developer out of
 * their own shop within a single testing session. It also punished anyone
 * legitimate: a household or an office behind one address shares an IP, so a
 * limit tuned for one person blocks the fourth colleague to sign in.
 *
 * These are set where a real person could not plausibly reach them but an
 * automated attack does so immediately. Development is looser still, because
 * the only traffic there is the person building the thing.
 */
const isProd = process.env.NODE_ENV === 'production';

/** A limit that is generous locally and firm once deployed. */
function limit(production: number, development: number) {
  return isProd ? production : development;
}

export const THROTTLE = {
  /** Everything not named below. Browsing must never feel it. */
  default: { ttl: 60_000, limit: limit(300, 3_000) },

  /** Guessing a password is the attack; mistyping one twice is not. */
  login: { ttl: 300_000, limit: limit(20, 500) },

  /** Slows bulk account creation without blocking a real shared address. */
  register: { ttl: 3_600_000, limit: limit(20, 500) },

  /**
   * The tightest, because each request sends someone an email. Anyone asking
   * more than a handful of times an hour is using the shop to pester a mailbox.
   */
  forgotPassword: { ttl: 3_600_000, limit: limit(8, 200) },

  /** Enough to reconsider several opinions, not enough to rate a catalogue. */
  reviewWrite: { ttl: 3_600_000, limit: limit(40, 500) },
} as const;
