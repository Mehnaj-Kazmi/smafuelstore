"use client";

import Link from "next/link";
import { usePrimaryStore } from "@/lib/store-context";

/**
 * Today's pump prices — the one card that is about fuel rather than the shop.
 *
 * Reads the store from context rather than fetching it.
 *
 * This was an async component that awaited the API, which was fine while the page
 * was rendered on a server. Once the home page became a client component this came
 * with it, and an async *client* component is re-invoked on every render — each
 * one starting a fresh request. The result was thousands of calls to
 * /api/store-locations, the rate limiter refusing them, and the page never
 * rendering at all.
 */
export default function FuelPrices() {
  const primaryStore = usePrimaryStore();

  return (
    <section className="card lift relative flex flex-col overflow-hidden p-5">
      {/* Fuel is the odd one out on this row, so it gets a warm wash. */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-orange opacity-20 blur-3xl"
        aria-hidden="true"
      />

      <h2 className="relative mb-1 text-[20px] font-extrabold leading-6 text-white">Today at the pump</h2>
      <p className="relative mb-4 text-xs text-ink-faint">
        {primaryStore.name} · {primaryStore.hours}
      </p>

      <ul className="relative flex-1 divide-y divide-line">
        {primaryStore.fuelPrices.map((f) => (
          <li key={f.grade} className="flex items-baseline justify-between py-2.5">
            <span className="text-sm font-semibold text-ink-soft">{f.grade}</span>
            <span className="font-mono text-lg font-bold tabular-nums text-white">
              ${f.price.toFixed(2)}
              <span className="ml-1 text-[11px] font-normal text-ink-faint">/gal</span>
            </span>
          </li>
        ))}
      </ul>

      <Link href="/contact" className="link-draw relative mt-5 self-start text-[13px] font-bold text-brand-green">
        Store details &amp; directions
      </Link>
    </section>
  );
}
