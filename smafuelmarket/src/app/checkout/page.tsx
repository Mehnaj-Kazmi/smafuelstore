"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useDelivery } from "@/lib/delivery";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/format";
import { applyCoupon, type Coupon } from "@/lib/deals";
import { placeOrder as submitOrder } from "@/lib/orders-api";
import ProductImage from "@/components/ProductImage";
import SmaLogo from "@/components/SmaLogo";

const TAX_RATE = 0.08;
const DELIVERY_FEE = 3.99;
const FREE_DELIVERY_OVER = 20;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, count, clear, hydrated, hasAgeRestricted } = useCart();
  const { canOrder, store, needsLocation, outOfRange, openLocationPrompt } = useDelivery();
  const { user, hydrated: authReady } = useAuth();

  /* The cart button already gates this, but the route has to hold the line on
     its own — otherwise a bookmark or a pasted URL walks straight past it. */
  useEffect(() => {
    if (authReady && !user) {
      router.replace("/signin?next=%2Fcheckout&intent=checkout");
    }
  }, [authReady, user, router]);

  const [payment, setPayment] = useState("card");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ coupon: Coupon; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [address, setAddress] = useState({ name: "", line1: "", city: store.city, postcode: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");

  const discount = coupon?.discount ?? 0;
  const discounted = Math.max(0, subtotal - discount);
  const deliveryFee = discounted >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  const tax = discounted * TAX_RATE;
  const total = discounted + deliveryFee + tax;

  if (!hydrated || !authReady || !user) {
    return <div className="mx-auto max-w-[1100px] px-4 py-10 text-sm text-ink-faint">Loading checkout…</div>;
  }

  /* Not knowing where they are is recoverable here, so it offers the dialog
     rather than turning them away like a verified out-of-area does. */
  if (needsLocation) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Where are we delivering?</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-faint">
          We deliver within {store.radiusMiles} miles of {store.city}. Set your location to finish checking out —
          your basket is saved.
        </p>
        <button
          type="button"
          onClick={openLocationPrompt}
          className="btn-pill btn-cart mt-5 inline-block font-medium"
        >
          Set delivery location
        </button>
      </div>
    );
  }

  if (!canOrder) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Delivery isn&apos;t available at your location</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-faint">
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
    /* Digits only — the store delivers inside one metro area, so a postcode
       here is always numeric and letters are a typo rather than a format. */
    if (!/^\d{4,10}$/.test(address.postcode.trim())) {
      next.postcode = "Postcode must be numbers only";
    }
    if (hasAgeRestricted && !ageConfirmed) next.age = "Confirm you are 21 or over to buy these items";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  /**
   * Sends the basket to the API, which prices it and writes the order.
   *
   * Only product ids and quantities go up — the totals shown on this page are
   * for the customer's benefit, and the server recalculates them from its own
   * prices so a tampered payload cannot set what it pays. The local cart is
   * cleared only once the API has confirmed, so a failed request leaves the
   * basket intact to retry.
   */
  async function submit() {
    if (!validate()) return;
    setPlacing(true);
    setPlaceError("");
    try {
      const order = await submitOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        address: {
          recipient: address.name,
          line1: address.line1,
          city: address.city,
          zip: address.postcode,
          notes: address.notes || undefined,
        },
        couponCode: coupon?.coupon.code,
      });
      clear();
      router.push(`/orders?placed=${order.id}`);
    } catch (err) {
      setPlaceError(err instanceof Error ? err.message : "Could not place the order");
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="SMA Fuel & Market home">
            <SmaLogo className="h-10 w-auto" />
          </Link>
          <h1 className="text-xl font-medium sm:text-2xl">
            Checkout <span className="text-base text-ink-faint">({count} items)</span>
          </h1>
          <Link href="/cart" className="text-[13px] text-brand-green hover:text-brand-green hover:underline">Back to basket</Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 border-b border-line pb-1 text-lg font-bold">
              <span className="text-brand-green">1</span> Delivery address
            </h2>
            <p className="mb-3 text-[13px] text-ink-faint">Delivering from {store.name} — about 30 minutes.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Full name" value={address.name} error={errors.name} onChange={(v) => setAddress({ ...address, name: v })} autoComplete="name" />
              <Field label="Street address" value={address.line1} error={errors.line1} onChange={(v) => setAddress({ ...address, line1: v })} autoComplete="address-line1" />
              <Field label="City" value={address.city} error={errors.city} onChange={(v) => setAddress({ ...address, city: v })} autoComplete="address-level2" />
              <Field
                label="Postcode"
                value={address.postcode}
                error={errors.postcode}
                /* Stripped as it is typed, so the field cannot hold anything
                   the validator would later reject. */
                onChange={(v) => setAddress({ ...address, postcode: v.replace(/\D/g, "").slice(0, 10) })}
                autoComplete="postal-code"
                inputMode="numeric"
              />
              <div className="sm:col-span-2">
                <Field label="Delivery notes (optional)" value={address.notes} onChange={(v) => setAddress({ ...address, notes: v })} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 border-b border-line pb-1 text-lg font-bold">
              <span className="text-brand-green">2</span> Payment
            </h2>
            <div className="space-y-2">
              {[
                { id: "card", label: "Credit or debit card", hint: "Visa, Mastercard, American Express" },
                { id: "cod", label: "Cash on delivery", hint: "Pay the driver when your order arrives" },
                { id: "fuel", label: "Fuel rewards balance", hint: "Available balance: $0.00" },
              ].map((o) => (
                <label key={o.id} className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${payment === o.id ? "border-sma-accent bg-brand-green/10" : "border-line"}`}>
                  <input type="radio" name="payment" checked={payment === o.id} onChange={() => setPayment(o.id)} className="mt-1 accent-brand-green" />
                  <span>
                    <span className="block text-sm font-bold">{o.label}</span>
                    <span className="block text-xs text-ink-faint">{o.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 rounded-md bg-surface-2 p-3 text-xs text-ink-faint">
              Demonstration storefront — no card details are collected and no payment is taken.
            </p>
          </section>

          {hasAgeRestricted && (
            <section>
              <h2 className="mb-3 border-b border-line pb-1 text-lg font-bold">
                <span className="text-brand-green">3</span> Age verification
              </h2>
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-brand-orange/35 bg-brand-orange/10 p-3">
                <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} className="mt-1 accent-brand-green" />
                <span className="text-[13px] leading-5 text-brand-orange">
                  I confirm I am <strong>21 or over</strong> and will present photo ID on delivery. The driver will
                  refuse handover without it and those items will be refunded.
                </span>
              </label>
              {errors.age && <p className="mt-1 text-xs text-sma-deal">{errors.age}</p>}
            </section>
          )}

          <section>
            <h2 className="mb-3 border-b border-line pb-1 text-lg font-bold">
              <span className="text-brand-green">{hasAgeRestricted ? 4 : 3}</span> Review your order
            </h2>
            <ul className="divide-y divide-sma-border border-y border-line">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 py-3">
                  <ProductImage
                    imageUrl={item.product.imageUrl}
                    art={item.product.art}
                    hue={item.product.hue}
                    alt={item.product.title}
                    className="h-14 w-14 shrink-0 rounded-md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm">{item.product.title}</p>
                    <p className="text-xs text-ink-faint">{item.product.unit} · Qty {item.quantity}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold">{money(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-line p-4">
            {placeError && (
              <p role="alert" className="mb-3 rounded-lg border border-sma-deal/40 bg-sma-deal/10 p-3 text-[13px] font-semibold text-sma-deal">
                {placeError}
              </p>
            )}
            <button type="button" onClick={submit} disabled={placing} className="btn-pill btn-buy w-full font-medium disabled:opacity-60">
              {placing ? "Placing order…" : "Place your order"}
            </button>

            <hr className="my-3 border-line" />

            <label htmlFor="coupon" className="mb-1 block text-[13px] font-bold">Coupon code</label>
            <div className="flex gap-2">
              <input
                id="coupon"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="e.g. SNACK10"
                className="w-full min-w-0 rounded-md border border-line px-2 py-1.5 text-sm outline-none focus:border-sma-accent"
              />
              <button type="button" onClick={redeem} className="btn-pill shrink-0 bg-surface-3 font-medium hover:bg-surface-2">
                Apply
              </button>
            </div>
            {couponError && <p className="mt-1 text-xs text-sma-deal">{couponError}</p>}
            {coupon && <p className="mt-1 text-xs text-brand-green">{coupon.coupon.code} applied — {coupon.coupon.description}</p>}

            <hr className="my-3 border-line" />

            <h2 className="mb-2 text-lg font-bold">Order summary</h2>
            <dl className="space-y-1 text-[13px]">
              <Row label={`Items (${count})`} value={money(subtotal)} />
              {discount > 0 && <Row label="Coupon discount" value={`−${money(discount)}`} tone="good" />}
              <Row label="Delivery" value={deliveryFee === 0 ? "FREE" : money(deliveryFee)} />
              <Row label="Estimated tax (8%)" value={money(tax)} />
            </dl>
            <hr className="my-2 border-line" />
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
      <dd className={tone === "good" ? "text-brand-green" : undefined}>{value}</dd>
    </div>
  );
}

function Field({
  label, value, onChange, error, autoComplete, inputMode,
}: {
  label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete?: string;
  /** `numeric` brings up the number pad on a phone. */
  inputMode?: "text" | "numeric";
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[13px] font-bold">{label}</label>
      <input
        id={id}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-sma-accent ${error ? "border-sma-deal" : "border-line"}`}
      />
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-sma-deal">{error}</p>}
    </div>
  );
}
