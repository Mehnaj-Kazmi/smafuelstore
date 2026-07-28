"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useDelivery } from "@/lib/delivery";
import { money } from "@/lib/format";
import { applyCoupon, type Coupon } from "@/lib/deals";
import ProductArt from "@/components/ProductArt";
import SmaLogo from "@/components/SmaLogo";

const TAX_RATE = 0.08;
const DELIVERY_FEE = 3.99;
const FREE_DELIVERY_OVER = 20;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, count, placeOrder, hydrated, hasAgeRestricted } = useCart();
  const { canOrder, store } = useDelivery();

  const [payment, setPayment] = useState("card");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ coupon: Coupon; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [address, setAddress] = useState({ name: "", line1: "", city: store.city, postcode: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);

  const discount = coupon?.discount ?? 0;
  const discounted = Math.max(0, subtotal - discount);
  const deliveryFee = discounted >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  const tax = discounted * TAX_RATE;
  const total = discounted + deliveryFee + tax;

  if (!hydrated) {
    return <div className="mx-auto max-w-[1100px] px-4 py-10 text-sm text-sma-muted">Loading checkout…</div>;
  }

  if (!canOrder) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Delivery isn&apos;t available at your location</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-sma-muted">
          We deliver within {store.radiusMiles} miles of {store.name}. Your basket is saved, so nothing is lost if
          you come back inside the area.
        </p>
        <Link href="/shop" className="btn-pill btn-cart mt-5 inline-block font-medium">Keep browsing</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">There is nothing to check out</h1>
        <Link href="/shop" className="btn-pill btn-cart mt-5 inline-block font-medium">Start shopping</Link>
      </div>
    );
  }

  function redeem() {
    const result = applyCoupon(couponInput, subtotal);
    if (result.ok) {
      setCoupon({ coupon: result.coupon, discount: result.discount });
      setCouponError("");
    } else {
      setCoupon(null);
      setCouponError(result.reason);
    }
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!address.name.trim()) next.name = "Enter a full name";
    if (!address.line1.trim()) next.line1 = "Enter a street address";
    if (!address.city.trim()) next.city = "Enter a city";
    if (!/^[A-Za-z0-9 -]{3,10}$/.test(address.postcode.trim())) next.postcode = "Enter a valid postcode";
    if (hasAgeRestricted && !ageConfirmed) next.age = "Confirm you are 21 or over to buy these items";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit() {
    if (!validate()) return;
    setPlacing(true);
    const order = placeOrder({
      subtotal,
      discount,
      deliveryFee,
      tax,
      total,
      couponCode: coupon?.coupon.code,
      address: `${address.line1}, ${address.city} ${address.postcode}`,
    });
    router.push(`/orders?placed=${order.id}`);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-sma-border">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="SMA Fuel & Market home">
            <SmaLogo className="h-10 w-auto" dark />
          </Link>
          <h1 className="text-xl font-medium sm:text-2xl">
            Checkout <span className="text-base text-sma-muted">({count} items)</span>
          </h1>
          <Link href="/cart" className="text-[13px] text-sma-link hover:text-sma-link-hover hover:underline">Back to basket</Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 border-b border-sma-border pb-1 text-lg font-bold">
              <span className="text-sma-link">1</span> Delivery address
            </h2>
            <p className="mb-3 text-[13px] text-sma-muted">Delivering from {store.name} — about 30 minutes.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Full name" value={address.name} error={errors.name} onChange={(v) => setAddress({ ...address, name: v })} autoComplete="name" />
              <Field label="Street address" value={address.line1} error={errors.line1} onChange={(v) => setAddress({ ...address, line1: v })} autoComplete="address-line1" />
              <Field label="City" value={address.city} error={errors.city} onChange={(v) => setAddress({ ...address, city: v })} autoComplete="address-level2" />
              <Field label="Postcode" value={address.postcode} error={errors.postcode} onChange={(v) => setAddress({ ...address, postcode: v })} autoComplete="postal-code" />
              <div className="sm:col-span-2">
                <Field label="Delivery notes (optional)" value={address.notes} onChange={(v) => setAddress({ ...address, notes: v })} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 border-b border-sma-border pb-1 text-lg font-bold">
              <span className="text-sma-link">2</span> Payment
            </h2>
            <div className="space-y-2">
              {[
                { id: "card", label: "Credit or debit card", hint: "Visa, Mastercard, American Express" },
                { id: "cod", label: "Cash on delivery", hint: "Pay the driver when your order arrives" },
                { id: "fuel", label: "Fuel rewards balance", hint: "Available balance: $0.00" },
              ].map((o) => (
                <label key={o.id} className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${payment === o.id ? "border-sma-accent bg-[#fffaf3]" : "border-sma-border"}`}>
                  <input type="radio" name="payment" checked={payment === o.id} onChange={() => setPayment(o.id)} className="mt-1 accent-sma-navy-light" />
                  <span>
                    <span className="block text-sm font-bold">{o.label}</span>
                    <span className="block text-xs text-sma-muted">{o.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 rounded-md bg-[#f7fafa] p-3 text-xs text-sma-muted">
              Demonstration storefront — no card details are collected and no payment is taken.
            </p>
          </section>

          {hasAgeRestricted && (
            <section>
              <h2 className="mb-3 border-b border-sma-border pb-1 text-lg font-bold">
                <span className="text-sma-link">3</span> Age verification
              </h2>
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-[#f0d4a3] bg-[#fdf3e3] p-3">
                <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} className="mt-1 accent-sma-navy-light" />
                <span className="text-[13px] leading-5 text-[#7a4a05]">
                  I confirm I am <strong>21 or over</strong> and will present photo ID on delivery. The driver will
                  refuse handover without it and those items will be refunded.
                </span>
              </label>
              {errors.age && <p className="mt-1 text-xs text-sma-deal">{errors.age}</p>}
            </section>
          )}

          <section>
            <h2 className="mb-3 border-b border-sma-border pb-1 text-lg font-bold">
              <span className="text-sma-link">{hasAgeRestricted ? 4 : 3}</span> Review your order
            </h2>
            <ul className="divide-y divide-sma-border border-y border-sma-border">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 py-3">
                  <ProductArt art={item.product.art} hue={item.product.hue} className="h-14 w-14 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm">{item.product.title}</p>
                    <p className="text-xs text-sma-muted">{item.product.unit} · Qty {item.quantity}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold">{money(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-sma-border p-4">
            <button type="button" onClick={submit} disabled={placing} className="btn-pill btn-buy w-full font-medium disabled:opacity-60">
              {placing ? "Placing order…" : "Place your order"}
            </button>

            <hr className="my-3 border-sma-border" />

            <label htmlFor="coupon" className="mb-1 block text-[13px] font-bold">Coupon code</label>
            <div className="flex gap-2">
              <input
                id="coupon"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="e.g. SNACK10"
                className="w-full min-w-0 rounded-md border border-sma-border px-2 py-1.5 text-sm outline-none focus:border-sma-accent"
              />
              <button type="button" onClick={redeem} className="btn-pill shrink-0 bg-[#f0f2f2] font-medium hover:bg-[#e3e6e6]">
                Apply
              </button>
            </div>
            {couponError && <p className="mt-1 text-xs text-sma-deal">{couponError}</p>}
            {coupon && <p className="mt-1 text-xs text-[#007600]">{coupon.coupon.code} applied — {coupon.coupon.description}</p>}

            <hr className="my-3 border-sma-border" />

            <h2 className="mb-2 text-lg font-bold">Order summary</h2>
            <dl className="space-y-1 text-[13px]">
              <Row label={`Items (${count})`} value={money(subtotal)} />
              {discount > 0 && <Row label="Coupon discount" value={`−${money(discount)}`} tone="good" />}
              <Row label="Delivery" value={deliveryFee === 0 ? "FREE" : money(deliveryFee)} />
              <Row label="Estimated tax (8%)" value={money(tax)} />
            </dl>
            <hr className="my-2 border-sma-border" />
            <p className="flex justify-between text-lg font-bold text-sma-price">
              <span>Order total</span>
              <span>{money(total)}</span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "good" }) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{label}</dt>
      <dd className={tone === "good" ? "text-[#007600]" : undefined}>{value}</dd>
    </div>
  );
}

function Field({
  label, value, onChange, error, autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[13px] font-bold">{label}</label>
      <input
        id={id}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-sma-accent ${error ? "border-sma-deal" : "border-sma-border"}`}
      />
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-sma-deal">{error}</p>}
    </div>
  );
}
