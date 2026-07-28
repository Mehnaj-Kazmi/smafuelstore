"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SmaLogo from "@/components/SmaLogo";
import { useAuth } from "@/lib/auth";

export default function SignInPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "password">("email");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        router.push(user.role === "ADMIN" ? "/admin" : "/");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Sign in failed");
        setSubmitting(false);
      });
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center bg-white px-4 py-6">
      <Link href="/" className="mb-4" aria-label="SMA Store home">
        <SmaLogo className="h-11 w-auto" dark />
      </Link>

      <div className="w-full max-w-[350px] rounded-lg border border-sma-border p-5">
        <h1 className="mb-3 text-[28px] font-medium leading-8">Sign in</h1>

        <form onSubmit={handleSubmit} noValidate>
          {step === "email" ? (
            <>
              <label htmlFor="email" className="mb-1 block text-[13px] font-bold">
                Email or mobile phone number
              </label>
              <input
                id="email"
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(error)}
                className="w-full rounded-md border border-sma-border px-3 py-1.5 text-sm outline-none focus:border-sma-accent"
              />
            </>
          ) : (
            <>
              <p className="mb-3 text-[13px]">
                {email}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError("");
                  }}
                  className="text-sma-link hover:text-sma-link-hover hover:underline"
                >
                  Change
                </button>
              </p>
              <label htmlFor="password" className="mb-1 block text-[13px] font-bold">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(error)}
                className="w-full rounded-md border border-sma-border px-3 py-1.5 text-sm outline-none focus:border-sma-accent"
              />
            </>
          )}

          {error && (
            <p role="alert" className="mt-2 text-[13px] text-sma-deal">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-pill btn-buy mt-4 w-full font-medium disabled:opacity-60">
            {submitting ? "Signing in…" : step === "email" ? "Continue" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-xs leading-4 text-sma-muted">
          By continuing, you agree to SMA Store&apos;s Conditions of Use and Privacy Notice.
        </p>
      </div>

      <div className="mt-6 w-full max-w-[350px]">
        <div className="relative mb-4 text-center">
          <span className="absolute inset-x-0 top-1/2 border-t border-sma-border" />
          <span className="relative bg-white px-3 text-xs text-sma-muted">New to SMA Store?</span>
        </div>
        <Link
          href="/register"
          className="btn-pill block bg-[#f0f2f2] text-center font-medium hover:bg-[#e3e6e6]"
        >
          Create your SMA Store account
        </Link>
      </div>
    </div>
  );
}
