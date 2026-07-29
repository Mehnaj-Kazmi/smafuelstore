import type { Metadata } from "next";
import Link from "next/link";
import { getPrimaryStore } from "@/lib/store-source";
import { departments, products } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "About us",
  description: "SMA Fuel & Market — a 24-hour gas station and convenience store with 30-minute local delivery.",
};

export default async function AboutPage() {
  const primaryStore = await getPrimaryStore();

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6">
      <div className="rounded-lg bg-gradient-to-r from-[#0f4c3a] to-[#1f8a5f] px-6 py-10 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">A corner shop that comes to you</h1>
        <p className="mt-2 max-w-xl text-sm text-white/90">
          {primaryStore.name} has been fuelling {primaryStore.city} around the clock. Now the whole shop —
          {" "}{products.length} products across {departments.length} departments — is available for delivery in about
          thirty minutes.
        </p>
      </div>

      <section className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          { n: "24/7", label: "Open every hour of every day, including holidays." },
          { n: "~30 min", label: "Average time from order placed to knock on the door." },
          { n: `${primaryStore.radiusMiles} miles`, label: "Delivery radius, so orders arrive cold or hot as intended." },
        ].map((s) => (
          <div key={s.n} className="bg-surface p-5">
            <p className="text-2xl font-bold text-sma-accent-dark">{s.n}</p>
            <p className="mt-1 text-[13px] leading-5 text-sma-muted">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-5 bg-surface p-6">
        <h2 className="mb-3 text-xl font-bold">Why the two-mile limit</h2>
        <p className="text-[13px] leading-6">
          Half of what we sell is temperature sensitive. Coffee goes cold, ice cream goes soft, and a breakfast
          sandwich stops being worth eating after about twenty minutes in a bag. Rather than deliver something we
          would not want to receive, we cap the radius at {primaryStore.radiusMiles} miles and keep the promise
          instead. If you are outside it you can still browse and build a basket — we will just ask you to collect
          in store.
        </p>
        <p className="mt-3 text-[13px] leading-6">
          As we open more locations, the site will pick whichever store is nearest to you automatically.
        </p>
      </section>

      <section className="mt-5 bg-surface p-6">
        <h2 className="mb-3 text-xl font-bold">Age-restricted sales</h2>
        <p className="text-[13px] leading-6">
          Tobacco and lighters require photo ID at handover, every time, regardless of what was confirmed at
          checkout. Drivers refuse handover without it and the item is refunded in full. There are no exceptions to
          this, and our drivers are supported when they say no.
        </p>
      </section>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/shop" className="btn-pill btn-cart font-medium">Shop the store</Link>
        <Link href="/contact" className="btn-pill bg-surface font-medium hover:bg-gray-50">Find us</Link>
      </div>
    </div>
  );
}
