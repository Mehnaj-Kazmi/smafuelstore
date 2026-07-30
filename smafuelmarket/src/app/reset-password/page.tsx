"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import SmaLogo from "@/components/SmaLogo";
import { useAuth } from "@/lib/auth";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { resetPassword } = useAuth();

  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Passwords must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match");
      return;
    }

    setSubmitting(true);
    setError("");
    resetPassword(token, password)
      .then((user) => {
        /* The reset already proved control of the mailbox and the API returned a
           session, so the visitor lands signed in rather than at a login form. */
        router.push(user.role === "ADMIN" ? "/admin" : "/");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not reset your password");
        setSubmitting(false);
      });
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center px-4 py-10">
      <Link href="/" className="mb-6" aria-label="SMA Fuel & Market home">
        <SmaLogo className="h-12 w-auto" />
      </Link>

      <div className="card w-full max-w-[380px] p-6">
        <h1 className="mb-5 text-[28px] font-extrabold leading-8 text-white">Choose a new password</h1>

        {!token ? (
          <>
            <p className="text-[13px] leading-5 text-sma-deal">
              This page needs a reset link. Ask for a new one and open it from your email.
            </p>
            <Link href="/forgot-password" className="btn-pill btn-cart mt-5 block w-full py-3 text-center">
              Request a reset link
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="password" className="mb-1.5 block text-[13px] font-bold text-ink-soft">
              New password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(error)}
              className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-brand-green"
            />

            <label htmlFor="confirm" className="mb-1.5 mt-4 block text-[13px] font-bold text-ink-soft">
              Confirm new password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              autoComplete="new-password"
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={Boolean(error)}
              className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-brand-green"
            />

            <p className="mt-2 text-[11px] text-ink-faint">At least 6 characters.</p>

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
              {submitting ? "Saving…" : "Set new password"}
            </button>
          </form>
        )}
      </div>

      <Link href="/signin" className="link-draw mt-6 text-[13px] font-bold text-brand-green">
        Back to sign in
      </Link>
    </div>
  );
}
