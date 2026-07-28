import Link from "next/link";
import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import { deals, dealKindClass, dealKindLabel, dealProducts, coupons } from "@/lib/deals";
import { getProduct } from "@/lib/catalog";
import { getCatalogProducts } from "@/lib/catalog-source";

export const metadata: Metadata = {
  title: "Daily Deals",
  description: "Flash sales, buy-one-get-one offers and weekend deals at SMA Fuel & Market.",
};

export default async function DealsPage() {
  const catalog = await getCatalogProducts();
  const all = dealProducts(catalog);

  return (
    <>
      <div className="bg-sma-deal text-white">
        <div className="mx-auto max-w-[1500px] px-5 py-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Daily Deals</h1>
          <p className="mt-1 text-sm text-white/90">
            Flash sales, BOGO offers and weekend markdowns. Prices update every morning.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-3 py-4">
        {/* Live offers */}
        <section className="bg-surface p-5">
          <h2 className="mb-4 text-xl font-bold">Running now</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => {
              const first = getProduct(deal.productIds[0], catalog);
              return (
                <article key={deal.id} className="flex flex-col rounded-lg border border-sma-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${dealKindClass[deal.kind]}`}>
                      {dealKindLabel[deal.kind]}
                    </span>
                    {deal.endsInHours != null && (
                      <span className="text-[11px] font-medium text-sma-deal">
                        Ends in {deal.endsInHours} hours
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold">{deal.title}</h3>
                  <p className="mt-1 flex-1 text-[13px] leading-5 text-sma-muted">{deal.detail}</p>
                  {first && (
                    <Link href={`/product/${first.id}`} className="mt-3 text-[13px] text-sma-link hover:text-sma-link-hover hover:underline">
                      Shop this offer
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* Coupons */}
        <section className="mt-5 bg-surface p-5">
          <h2 className="mb-1 text-xl font-bold">Coupon codes</h2>
          <p className="mb-4 text-[13px] text-sma-muted">Enter any of these at checkout.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {coupons.map((c) => (
              <div key={c.code} className="rounded-lg border border-dashed border-sma-accent-dark bg-[#fffaf3] p-4">
                <p className="font-mono text-lg font-bold tracking-wider">{c.code}</p>
                <p className="mt-1 text-[13px]">{c.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Discounted products */}
        <section className="mt-5 bg-surface p-5">
          <h2 className="mb-4 text-xl font-bold">Everything on offer</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            {all.map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
