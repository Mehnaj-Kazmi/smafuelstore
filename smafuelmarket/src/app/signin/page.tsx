"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import SmaLogo from "@/components/SmaLogo";
import { useAuth } from "@/lib/auth";
import { intentMessage } from "@/lib/auth-gate";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "password">("email");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* Where the visitor was when the auth gate interrupted them. Only same-site
     paths are honoured, so a crafted ?next= cannot bounce them off the site. */
  const rawNext = params.get("next");
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;
  const reason = intentMessage(params.get("intent"));

  const registerHref = next
    ? `/register?next=${encodeURIComponent(next)}`
    : "/register";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        setError("Enter a valid email address");
        return;
      }
      setError("");
      setStep("password");
      return;
    }
    if (password.length < 6) {
      setError("Passwords must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    setError("");
    login(email, password)
      .then((user) => {
        if (user.role === "ADMIN") return router.push("/admin");
        router.push(next ?? "/");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Sign in failed");
        setSubmitting(false);
      });
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center px-4 py-10">
      <Link href="/" className="mb-6" aria-label="SMA Fuel & Market home">
        <SmaLogo className="h-12 w-auto" />
      </Link>

      {reason && (
        <p className="anim-rise mb-4 w-full max-w-[380px] rounded-xl border border-brand-green/35 bg-brand-green/10 px-4 py-3 text-center text-[13px] font-semibold text-[#7ef0ac]">
          {reason}
        </p>
      )}

      <div className="card w-full max-w-[380px] p-6">
        <h1 className="mb-5 text-[28px] font-extrabold leading-8 text-white">Sign in</h1>

        <form onSubmit={handleSubmit} noValidate>
          {step === "email" ? (
            <>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-bold text-ink-soft">
                Email or mobile phone number
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
            </>
          ) : (
            <>
              <p className="mb-3 text-[13px] text-ink-soft">
                {email}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError("");
                  }}
                  className="link-draw font-bold text-brand-green"
                >
                  Change
                </button>
              </p>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-bold text-ink-soft">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(error)}
                className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-brand-green"
              />
            </>
          )}

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
            {submitting ? "Signing in…" : step === "email" ? "Continue" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-xs leading-5 text-ink-faint">
          By continuing, you agree to SMA Fuel &amp; Market&apos;s Conditions of Use and Privacy Notice.
        </p>
      </div>

      <div className="mt-8 w-full max-w-[380px]">
        <div className="relative mb-5 text-center">
          <span className="absolute inset-x-0 top-1/2 border-t border-line" />
          <span className="relative bg-black px-3 text-xs font-semibold text-ink-faint">
            New to SMA Fuel &amp; Market?
          </span>
        </div>
        <Link href={registerHref} className="btn-pill btn-ghost block w-full py-3 text-center">
          Create your account
        </Link>
      </div>
    </div>
  );
}
