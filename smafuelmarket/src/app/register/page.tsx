"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import SmaLogo from "@/components/SmaLogo";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  /* Carried over from the auth gate so a new account lands back on whatever
     the visitor was trying to do. Same-site paths only. */
  const rawNext = params.get("next");
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;

  const signInHref = next ? `/signin?next=${encodeURIComponent(next)}` : "/signin";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) nextErrors.email = "Enter a valid email address";
    if (!/^[0-9 ()+-]{7,}$/.test(form.phone)) nextErrors.phone = "Enter a contact number for the driver";
    if (form.password.length < 8) nextErrors.password = "Use at least 8 characters";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    register({ name: form.name, email: form.email, phone: form.phone, password: form.password })
      .then(() => router.push(next ?? "/"))
      .catch((err) => {
        setErrors({ email: err instanceof Error ? err.message : "Registration failed" });
        setSubmitting(false);
      });
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center px-4 py-10">
      <Link href="/" className="mb-6" aria-label="SMA Fuel & Market home">
        <SmaLogo className="h-12 w-auto" />
      </Link>

      <div className="card w-full max-w-[380px] p-6">
        <h1 className="mb-5 text-[28px] font-extrabold leading-8 text-white">Create account</h1>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Your name" value={form.name} error={errors.name} onChange={(v) => setForm({ ...form, name: v })} autoComplete="name" />
          <Field label="Email" type="email" value={form.email} error={errors.email} onChange={(v) => setForm({ ...form, email: v })} autoComplete="email" />
          <Field label="Mobile number" value={form.phone} error={errors.phone} onChange={(v) => setForm({ ...form, phone: v })} autoComplete="tel" />
          <Field label="Password" type="password" value={form.password} error={errors.password} onChange={(v) => setForm({ ...form, password: v })} autoComplete="new-password" />
          <button type="submit" disabled={submitting} className="btn-pill btn-cart w-full py-3 disabled:opacity-60">
            {submitting ? "Creating account…" : "Create your account"}
          </button>
        </form>

        <p className="mt-5 text-xs leading-5 text-ink-faint">
          We use your mobile number so the driver can reach you at the door.
        </p>

        <p className="mt-5 border-t border-line pt-4 text-[13px] text-ink-soft">
          Already have an account?{" "}
          <Link href={signInHref} className="link-draw font-bold text-brand-green">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, error, type = "text", autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void; error?: string; type?: string; autoComplete?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-bold text-ink-soft">{label}</label>
      <input
        id={id} type={type} value={value} autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-lg border bg-surface-2 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-brand-green ${
          error ? "border-sma-deal" : "border-line"
        }`}
      />
      {error && <p className="mt-1.5 text-xs font-semibold text-sma-deal">{error}</p>}
    </div>
  );
}
