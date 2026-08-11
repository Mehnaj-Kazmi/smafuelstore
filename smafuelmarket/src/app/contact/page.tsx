"use client";

import { useStores } from "@/lib/store-context";

export default function ContactPage() {
  const stores = useStores();
  const primaryStore = stores[0];

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6">
      <div className="rounded-lg bg-sma-navy-light px-6 py-8 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">Contact &amp; locations</h1>
        <p className="mt-1 text-sm text-gray-300">Open {primaryStore.hours.toLowerCase()} — call any time.</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {stores.map((s) => (
          <section key={s.id} className="bg-surface p-6">
            <h2 className="text-lg font-bold">{s.name}</h2>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex gap-3"><dt className="w-24 shrink-0 text-sma-muted">Address</dt><dd>{s.address}, {s.city}</dd></div>
              <div className="flex gap-3"><dt className="w-24 shrink-0 text-sma-muted">Phone</dt><dd>{s.phone}</dd></div>
              <div className="flex gap-3"><dt className="w-24 shrink-0 text-sma-muted">Hours</dt><dd>{s.hours}</dd></div>
              <div className="flex gap-3"><dt className="w-24 shrink-0 text-sma-muted">Delivery</dt><dd>Within {s.radiusMiles} miles</dd></div>
              <div className="flex gap-3"><dt className="w-24 shrink-0 text-sma-muted">Coordinates</dt><dd className="font-mono text-xs">{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</dd></div>
            </dl>

            <h3 className="mb-2 mt-5 text-sm font-bold">Fuel prices today</h3>
            <ul className="divide-y divide-sma-border">
              {s.fuelPrices.map((f) => (
                <li key={f.grade} className="flex justify-between py-2 text-[13px]">
                  <span>{f.grade}</span>
                  <span className="font-mono tabular-nums">${f.price.toFixed(2)}/gal</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="bg-surface p-6">
          <h2 className="text-lg font-bold">Send us a message</h2>
          <p className="mt-1 text-[13px] text-sma-muted">We answer within a couple of hours, day or night.</p>
          <form className="mt-4 space-y-3">
            <div>
              <label htmlFor="cname" className="mb-1 block text-[13px] font-bold">Your name</label>
              <input id="cname" className="w-full rounded-md border border-sma-border px-3 py-2 text-sm outline-none focus:border-sma-accent" />
            </div>
            <div>
              <label htmlFor="cemail" className="mb-1 block text-[13px] font-bold">Email</label>
              <input id="cemail" type="email" className="w-full rounded-md border border-sma-border px-3 py-2 text-sm outline-none focus:border-sma-accent" />
            </div>
            <div>
              <label htmlFor="cmsg" className="mb-1 block text-[13px] font-bold">Message</label>
              <textarea id="cmsg" rows={4} className="w-full rounded-md border border-sma-border px-3 py-2 text-sm outline-none focus:border-sma-accent" />
            </div>
            <button type="button" className="btn-pill btn-cart font-medium">Send message</button>
            <p className="text-xs text-sma-muted">Demonstration form — messages are not delivered.</p>
          </form>
        </section>
      </div>
    </div>
  );
}
