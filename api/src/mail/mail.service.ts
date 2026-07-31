import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

/**
 * `reason` carries why a message did not go, so the caller can say something
 * specific instead of a generic "email is not set up". "You can only send to
 * your own address until a domain is verified" is a five-minute fix; "no email
 * service" sends someone off reconfiguring one that already works.
 */
type SendResult = { delivered: boolean; previewUrl?: string; reason?: string };

/**
 * Fail fast rather than hang.
 *
 * A blocked or unreachable mail host does not refuse a connection, it simply
 * never answers, and nodemailer's default is to wait a very long time for that.
 * A password reset was taking twenty-one seconds to come back because every
 * request sat waiting on a port that was never going to reply. Better to give
 * up quickly and log why.
 */
const TIMEOUTS = {
  connectionTimeout: 8_000,
  greetingTimeout: 8_000,
  socketTimeout: 12_000,
} as const;

/**
 * Strips the spaces out of a Gmail App Password.
 *
 * Google shows the sixteen characters as four groups — `abcd efgh ijkl mnop` —
 * and copying it naturally brings the spaces along. The server then sees a
 * nineteen-character string and answers "Username and Password not accepted",
 * which reads as a wrong password rather than a stray space, and sends people
 * off regenerating a credential that was right all along.
 *
 * Whitespace is never meaningful in these, so removing it is safe and spares
 * everyone that hunt.
 */
function appPassword(value?: string): string | undefined {
  return value?.replace(/\s+/g, '') || undefined;
}

/** Turns Resend's raw refusal into the one sentence that says what to change. */
function explainResend(raw: string): string {
  if (raw.includes('only send testing emails to your own email address')) {
    const own = /\(([^)]+)\)/.exec(raw)?.[1];
    return (
      `Resend will only deliver to ${own ?? 'the address you signed up with'} until a sending ` +
      'domain is verified. Add one at https://resend.com/domains, then set MAIL_FROM to an ' +
      'address at that domain to reach anyone else.'
    );
  }
  if (raw.includes('domain is not verified')) {
    return (
      'The MAIL_FROM domain is not verified with Resend. Use ' +
      '"onboarding@resend.dev" for testing, or verify your own domain at ' +
      'https://resend.com/domains.'
    );
  }
  if (raw.includes('401')) {
    return 'The Resend API key was rejected — check RESEND_API_KEY at https://resend.com/api-keys.';
  }
  return raw;
}

/**
 * Outbound email.
 *
 * Three modes, chosen from the environment rather than from a flag, so the same
 * code path runs everywhere:
 *
 *   SMTP     — `SMTP_HOST` is set, so mail goes to that server. Production.
 *   Ethereal — no SMTP configured and not production: a throwaway inbox is
 *              created on the fly and the message is delivered there. The real
 *              send path is exercised and the message is viewable at a preview
 *              URL, which beats a console line for checking layout and links.
 *   Log      — nothing configured and Ethereal unreachable. The message is
 *              logged so a developer offline can still complete the flow.
 *
 * A failure to send is never allowed to fail the request that triggered it —
 * see the callers, which treat delivery as best-effort.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
  private mode: 'resend' | 'smtp' | 'ethereal' | 'log' = 'log';
  /** Set once Ethereal proves unreachable, so it is not tried again. */
  private etherealUnavailable = false;

  private get from(): string {
    return (
      process.env.MAIL_FROM ?? 'SMA Fuel & Market <no-reply@smafuel.market>'
    );
  }

  /** Built once and reused; Ethereal accounts are created lazily on first send. */
  private async transport(): Promise<nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null> {
    if (this.transporter) return this.transporter;

    if (process.env.SMTP_HOST) {
      /*
       * Half-configured is worth naming.
       *
       * A host and a username with no password still produces a transport, and
       * the server answers with a bare "535 Username and Password not
       * accepted" — which reads like the password is wrong rather than absent.
       * Saying so here saves that hunt.
       */
      if (process.env.SMTP_USER && !process.env.SMTP_PASS?.trim()) {
        this.logger.warn(
          `SMTP_USER is set to ${process.env.SMTP_USER} but SMTP_PASS is empty, so email cannot be sent. ` +
            'Gmail needs a 16-character App Password from https://myaccount.google.com/apppasswords ' +
            '— the account password will not work.',
        );
        return null;
      }

      const port = Number(process.env.SMTP_PORT ?? 587);
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        /* 465 is implicit TLS; everything else upgrades with STARTTLS. */
        secure: port === 465,
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: appPassword(process.env.SMTP_PASS),
            }
          : undefined,
        ...TIMEOUTS,
      });
      this.mode = 'smtp';
      this.logger.log(`Email via SMTP at ${process.env.SMTP_HOST}:${port}`);
      return this.transporter;
    }

    if (process.env.NODE_ENV === 'production') {
      this.logger.warn(
        'No SMTP_HOST configured in production — email will only be logged',
      );
      return null;
    }

    /* Asked for once. Ethereal is reachable or it is not, and retrying a
       blocked host on every password reset only repeats the wait. */
    if (this.etherealUnavailable) return null;

    try {
      const account = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
        ...TIMEOUTS,
      });
      this.mode = 'ethereal';
      this.logger.log(
        'Email via Ethereal test inbox — messages are not delivered to real addresses',
      );
      return this.transporter;
    } catch (err) {
      this.etherealUnavailable = true;
      this.logger.warn(
        `Could not reach Ethereal, falling back to logging: ${err instanceof Error ? err.message : err}. ` +
          'Set SMTP_HOST in api/.env to send real email.',
      );
      return null;
    }
  }

  /**
   * Hands the message to Resend over HTTPS.
   *
   * Preferred when configured, because it sidesteps the two things that keep
   * stopping mail from leaving: Gmail refuses account passwords over SMTP and
   * wants a generated App Password, and mail ports are often blocked outright
   * on office and home networks. Port 443 is not, and an API key is a single
   * value with no second factor behind it.
   */
  private async sendViaResend(
    key: string,
    input: { to: string; subject: string; html: string; text: string },
  ): Promise<SendResult> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      this.logger.log(`Email sent to ${input.to} (resend)`);
      return { delivered: true };
    }

    /* Resend explains refusals in the body — an unverified sending domain, or
       a key that does not exist — and that detail is what makes it fixable. */
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend returned ${res.status}: ${detail.slice(0, 300)}`);
  }

  async send(input: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<SendResult> {
    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (resendKey) {
      try {
        return await this.sendViaResend(resendKey, input);
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Email to ${input.to} failed: ${reason}\n${input.text}`,
        );
        return { delivered: false, reason: explainResend(reason) };
      }
    }

    const transporter = await this.transport();

    if (!transporter) {
      this.logger.log(
        `[email not sent] to=${input.to} subject="${input.subject}"\n${input.text}`,
      );
      return { delivered: false };
    }

    try {
      /* Typed explicitly: sendMail resolves to `any`, which would spread
         untyped through the preview-URL lookup below. */
      const info: SMTPTransport.SentMessageInfo = await transporter.sendMail({
        from: this.from,
        ...input,
      });
      const previewUrl =
        this.mode === 'ethereal'
          ? nodemailer.getTestMessageUrl(info) || undefined
          : undefined;

      this.logger.log(
        `Email sent to ${input.to} (${this.mode})${previewUrl ? ` — preview: ${previewUrl}` : ''}`,
      );
      return { delivered: true, previewUrl };
    } catch (err) {
      /* Logged rather than thrown: the caller has already done the work the
         customer asked for, and a mail outage should not undo it. */
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Email to ${input.to} failed: ${reason}\n${input.text}`,
      );

      /* A test inbox that cannot be reached is not worth waiting on again —
         every later send would pay the same timeout for the same answer. */
      if (this.mode === 'ethereal') {
        this.etherealUnavailable = true;
        this.transporter = undefined;
        this.mode = 'log';
        this.logger.warn(
          'Ethereal is unreachable from this network, so email will only be logged. ' +
            'Set SMTP_HOST, SMTP_USER and SMTP_PASS in api/.env to send real email.',
        );
      }

      return { delivered: false };
    }
  }

  /** The reset-link email. Kept here so the wording lives with the transport. */
  async sendPasswordReset(
    to: string,
    name: string,
    link: string,
  ): Promise<SendResult> {
    const subject = 'Reset your SMA Fuel & Market password';

    const text = [
      `Hi ${name},`,
      '',
      'Use the link below to choose a new password. It works once and expires in one hour.',
      '',
      link,
      '',
      "If you didn't ask for this, you can ignore this email — your password stays as it is.",
      '',
      'SMA Fuel & Market',
    ].join('\n');

    const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#0b0b0d;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#e8e8ea">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#15151a;border:1px solid #2a2a31;border-radius:16px">
      <tr><td style="padding:28px">
        <p style="margin:0 0 4px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#00b04f">SMA Fuel &amp; Market</p>
        <h1 style="margin:0 0 14px;font-size:22px;color:#fff">Reset your password</h1>
        <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#b8b8c0">
          Hi ${name}, use the button below to choose a new password. It works once and expires in one hour.
        </p>
        <p style="margin:0 0 22px">
          <a href="${link}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#00b04f;color:#fff;font-size:14px;font-weight:700;text-decoration:none">Choose a new password</a>
        </p>
        <p style="margin:0 0 6px;font-size:12px;color:#8a8a93">Or paste this link into your browser:</p>
        <p style="margin:0 0 22px;font-size:12px;word-break:break-all"><a href="${link}" style="color:#00b04f">${link}</a></p>
        <p style="margin:0;padding-top:18px;border-top:1px solid #2a2a31;font-size:12px;line-height:20px;color:#8a8a93">
          If you didn&rsquo;t ask for this, you can ignore this email &mdash; your password stays as it is.
        </p>
      </td></tr>
    </table>
  </body>
</html>`;

    return this.send({ to, subject, html, text });
  }
}
