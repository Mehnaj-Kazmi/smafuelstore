"use client";

import Link from "next/link";
import { useState } from "react";
import SmaLogo from "@/components/SmaLogo";
import { requestPasswordReset } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<{
    message: string;
    devResetLink?: string;
    devMailDelivered?: boolean;
    devMailReason?: string;
    devPreviewUrl?: string;
  } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }

    setSubmitting(true);
    setError("");
    requestPasswordReset(email)
      .then(setSent)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not send the reset link"))
      .finally(() => setSubmitting(false));
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center px-4 py-10">
      <Link href="/" className="mb-6" aria-label="SMA Fuel & Market home">
        <SmaLogo className="h-12 w-auto" />
      </Link>

      <div className="card w-full max-w-[380px] p-6">
        <h1 className="mb-2 text-[28px] font-extrabold leading-8 text-white">Reset your password</h1>

        {sent ? (
          <>
            {/* Worded so it never confirms whether the address is registered. */}
            <p className="mt-3 rounded-xl border border-brand-green/35 bg-brand-green/10 px-4 py-3 text-[13px] font-semibold text-[#7ef0ac]">
              {sent.message}
            </p>
            <p className="mt-3 text-[12px] leading-5 text-ink-faint">
              The link is good for one hour and can only be used once. Check your spam folder if it
              hasn&apos;t arrived.
            </p>

            {sent.devMailDelivered && (
              /* Development only, and purely reassurance: it confirms the mail
                 really left rather than leaving the tester wondering. Carries
                 no link, because the inbox is the way in once one has been
                 sent — exactly as it will be in production. */
              <p className="mt-3 text-[12px] font-semibold leading-5 text-brand-green">
                Email delivered — check the inbox, and the spam folder.
              </p>
            )}

            {sent.devResetLink && (
              /* Development only, and only when nothing was delivered, so an
                 unconfigured mail setup does not block work. A live reset token
                 is not printed on screen once a real email carries it. */
              <div className="mt-4 rounded-xl border border-brand-orange/40 bg-brand-orange/10 p-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand-orange">
                  Development only
                </p>
                <p className="mt-1 text-[12px] leading-5 text-ink-soft">
                  {sent.devMailReason
                    ? "The email could not be delivered, so use this link directly:"
                    : "No email service is set up yet, so use this link directly:"}
                </p>
                {!sent.devMailDelivered && sent.devMailReason && (
                  <p className="mt-1.5 text-[11px] leading-4 text-brand-orange">{sent.devMailReason}</p>
                )}
                <Link
                  href={sent.devResetLink.replace(/^https?:\/\/[^/]+/, "")}
                  className="mt-2 block break-all text-[12px] font-bold text-brand-green underline"
                >
                  {sent.devResetLink}
                </Link>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="mb-5 text-[13px] leading-5 text-ink-soft">
              Enter the email on your account and we&apos;ll send a link to set a new password.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-bold text-ink-soft">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(error)}
                className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-brand-green"
              />

              {error && (
                <p role="alert" className="mt-2.5 text-[13px] font-semibold text-sma-deal">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-pill btn-cart mt-5 w-full py-3 disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>

      <Link href="/signin" className="link-draw mt-6 text-[13px] font-bold text-brand-green">
        Back to sign in
      </Link>
    </div>
  );
}
