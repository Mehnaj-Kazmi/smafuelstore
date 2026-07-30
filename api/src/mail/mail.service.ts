import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

type SendResult = { delivered: boolean; previewUrl?: string };

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
  private transporter?: nodemailer.Transporter;
  private mode: 'smtp' | 'ethereal' | 'log' = 'log';

  private get from(): string {
    return process.env.MAIL_FROM ?? 'SMA Fuel & Market <no-reply@smafuel.market>';
  }

  /** Built once and reused; Ethereal accounts are created lazily on first send. */
  private async transport(): Promise<nodemailer.Transporter | null> {
    if (this.transporter) return this.transporter;

    if (process.env.SMTP_HOST) {
      const port = Number(process.env.SMTP_PORT ?? 587);
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        /* 465 is implicit TLS; everything else upgrades with STARTTLS. */
        secure: port === 465,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      this.mode = 'smtp';
      this.logger.log(`Email via SMTP at ${process.env.SMTP_HOST}:${port}`);
      return this.transporter;
    }

    if (process.env.NODE_ENV === 'production') {
      this.logger.warn('No SMTP_HOST configured in production — email will only be logged');
      return null;
    }

    try {
      const account = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      });
      this.mode = 'ethereal';
      this.logger.log('Email via Ethereal test inbox — messages are not delivered to real addresses');
      return this.transporter;
    } catch (err) {
      this.logger.warn(
        `Could not reach Ethereal, falling back to logging: ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }
  }

  async send(input: { to: string; subject: string; html: string; text: string }): Promise<SendResult> {
    const transporter = await this.transport();

    if (!transporter) {
      this.logger.log(`[email not sent] to=${input.to} subject="${input.subject}"\n${input.text}`);
      return { delivered: false };
    }

    try {
      const info = await transporter.sendMail({ from: this.from, ...input });
      const previewUrl = this.mode === 'ethereal'
        ? (nodemailer.getTestMessageUrl(info) || undefined)
        : undefined;

      this.logger.log(
        `Email sent to ${input.to} (${this.mode})${previewUrl ? ` — preview: ${previewUrl}` : ''}`,
      );
      return { delivered: true, previewUrl };
    } catch (err) {
      /* Logged rather than thrown: the caller has already done the work the
         customer asked for, and a mail outage should not undo it. */
      this.logger.error(
        `Email to ${input.to} failed: ${err instanceof Error ? err.message : err}\n${input.text}`,
      );
      return { delivered: false };
    }
  }

  /** The reset-link email. Kept here so the wording lives with the transport. */
  async sendPasswordReset(to: string, name: string, link: string): Promise<SendResult> {
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
