import 'dotenv/config';
import { MailService } from '../src/mail/mail.service';

/**
 * Sends one real email, so mail configuration can be checked on its own.
 *
 * Working out whether email is set up by requesting a password reset means
 * reading server logs and guessing at which of several fallbacks answered. This
 * says plainly what it did and, when it fails, what to change.
 *
 * Run with:  npx tsx scripts/test-email.ts you@example.com
 */
async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error('  Usage: npx tsx scripts/test-email.ts you@example.com');
    process.exit(1);
  }

  const resend = process.env.RESEND_API_KEY?.trim();
  const host = process.env.SMTP_HOST;

  console.log(`  RESEND_API_KEY: ${resend ? `(set, ${resend.slice(0, 3)}…)` : 'NOT SET'}`);
  console.log(`  SMTP_HOST:      ${host ?? 'NOT SET'}`);
  console.log(`  SMTP_USER:      ${process.env.SMTP_USER ?? 'NOT SET'}`);
  console.log(`  SMTP_PASS:      ${process.env.SMTP_PASS?.trim() ? '(set)' : 'NOT SET'}`);
  console.log(`  MAIL_FROM:      ${process.env.MAIL_FROM ?? '(default)'}`);
  console.log(`  → will use:     ${resend ? 'Resend (HTTPS)' : host ? 'SMTP' : 'nothing — logging only'}\n`);

  if (!resend && !host) {
    console.log('  Neither is configured, so nothing will be delivered.');
    console.log('  Set RESEND_API_KEY (easiest) or the SMTP_* lines in api/.env, then run this again.\n');
  }

  const mail = new MailService();
  const result = await mail.sendPasswordReset(
    to,
    'there',
    `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password?token=test-token-not-valid`,
  );

  console.log('');
  if (result.delivered) {
    console.log(`  SENT to ${to}.`);
    if (result.previewUrl) console.log(`  Preview: ${result.previewUrl}`);
    else console.log('  Check the inbox (and the spam folder).');
  } else {
    console.log('  NOT SENT — see the error above.');
    console.log('  Common causes:');
    if (process.env.RESEND_API_KEY?.trim()) {
      console.log('    • 403 / "domain not verified" — without a verified domain Resend only sends');
      console.log('      FROM onboarding@resend.dev and only TO the address you signed up with.');
      console.log('      Set MAIL_FROM="SMA Fuel & Market <onboarding@resend.dev>" to test.');
      console.log('    • 401 — the API key is wrong or was revoked (https://resend.com/api-keys).');
    } else {
      console.log('    • Gmail needs a 16-character App Password, not the account password —');
      console.log('      Google disabled account passwords over SMTP in 2022.');
      console.log('    • The App Password must be generated under the SAME account as SMTP_USER.');
      console.log('    • SMTP_PORT should be 587 (STARTTLS) or 465 (implicit TLS).');
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
