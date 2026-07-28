"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SmaLogo from "@/components/SmaLogo";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) next.email = "Enter a valid email address";
    if (!/^[0-9 ()+-]{7,}$/.test(form.phone)) next.phone = "Enter a contact number for the driver";
    if (form.password.length < 8) next.password = "Use at least 8 characters";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    register({ name: form.name, email: form.email, phone: form.phone, password: form.password })
      .then(() => router.push("/"))
      .catch((err) => {
        setErrors({ email: err instanceof Error ? err.message : "Registration failed" });
        setSubmitting(false);
      });
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center bg-white px-4 py-6">
      <Link href="/" className="mb-4" aria-label="SMA Fuel & Market home">
        <SmaLogo className="h-12 w-auto" dark />
      </Link>

      <div className="w-full max-w-[380px] rounded-lg border border-sma-border p-5">
        <h1 className="mb-3 text-[28px] font-medium leading-8">Create account</h1>
        <form onSubmit={submit} noValidate className="space-y-3">
          <Field label="Your name" value={form.name} error={errors.name} onChange={(v) => setForm({ ...form, name: v })} autoComplete="name" />
          <Field label="Email" type="email" value={form.email} error={errors.email} onChange={(v) => setForm({ ...form, email: v })} autoComplete="email" />
          <Field label="Mobile number" value={form.phone} error={errors.phone} onChange={(v) => setForm({ ...form, phone: v })} autoComplete="tel" />
          <Field label="Password" type="password" value={form.password} error={errors.password} onChange={(v) => setForm({ ...form, password: v })} autoComplete="new-password" />
          <button type="submit" disabled={submitting} className="btn-pill btn-buy w-full font-medium disabled:opacity-60">
            {submitting ? "Creating account…" : "Create your account"}
          </button>
        </form>

        <p className="mt-4 text-xs leading-4 text-sma-muted">
          We use your mobile number so the driver can reach you at the door.
        </p>

        <p className="mt-4 border-t border-sma-border pt-3 text-[13px]">
          Already have an account?{" "}
          <Link href="/signin" className="text-sma-link hover:text-sma-link-hover hover:underline">Sign in</Link>
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
      <label htmlFor={id} className="mb-1 block text-[13px] font-bold">{label}</label>
      <input
        id={id} type={type} value={value} autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-md border px-3 py-1.5 text-sm outline-none focus:border-sma-accent ${error ? "border-sma-deal" : "border-sma-border"}`}
      />
      {error && <p className="mt-1 text-xs text-sma-deal">{error}</p>}
    </div>
  );
}
