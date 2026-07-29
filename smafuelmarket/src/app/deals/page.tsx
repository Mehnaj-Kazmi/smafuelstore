import Link from "next/link";
import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import { dealKindClass, dealKindLabel, dealProducts, coupons } from "@/lib/deals";
import { getDeals } from "@/lib/deals-source";
import { getProduct } from "@/lib/catalog";
import { getCatalogProducts } from "@/lib/catalog-source";

export const metadata: Metadata = {
  title: "Daily Deals",
  description: "Flash sales, buy-one-get-one offers and weekend deals at SMA Fuel & Market.",
};

export default async function DealsPage() {
  /* Both from the API, so a promotion created or photographed in the admin
     panel appears here — this page used to render a hardcoded list, which is
     why uploaded deal artwork never showed up. */
  const [catalog, deals] = await Promise.all([getCatalogProducts(), getDeals()]);
  const all = dealProducts(catalog, deals);

  return (
    <>
      <div className="border-b border-line bg-sma-deal">
        <div className="mx-auto max-w-[1500px] px-5 py-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Daily Deals</h1>
          <p className="mt-1.5 text-sm text-white/90">
            Flash sales, BOGO offers and weekend markdowns. Prices update every morning.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-8">
        {/* Live offers */}
        <section className="card p-6">
          <h2 className="mb-5 text-[22px] font-extrabold text-white">Running now</h2>

          {deals.length === 0 ? (
            <p className="text-[13px] text-ink-faint">No promotions are running right now.</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {deals.map((deal) => {
                const first = getProduct(deal.productIds[0], catalog);
                return (
                  <article
                    key={deal.id}
                    className="lift flex flex-col overflow-hidden rounded-xl border border-line bg-surface-2"
                  >
                    {/* Promotional artwork, uploaded per deal in the admin panel.
                        Falls back to the first product's picture so a deal with
                        no artwork of its own still reads as a promotion. */}
                    <Link href={first ? `/product/${first.id}` : "/shop"} className="block">
                      <div className="aspect-[16/9] overflow-hidden bg-white">
                        <ProductImage
                          imageUrl={deal.imageUrl ?? first?.imageUrl}
                          art={first?.art ?? "chips"}
                          hue={first?.hue ?? 45}
                          alt={deal.title}
                          className="h-full w-full"
                        />
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${dealKindClass[deal.kind]}`}
                        >
                          {dealKindLabel[deal.kind]}
                        </span>
                        {deal.endsInHours != null && (
                          <span className="text-[11px] font-bold text-sma-deal">
                            Ends in {deal.endsInHours} hours
                          </span>
                        )}
                        {deal.percentOff != null && (
                          <span className="text-[11px] font-bold text-brand-green">{deal.percentOff}% off</span>
                        )}
                      </div>

                      <h3 className="text-base font-extrabold text-white">{deal.title}</h3>
                      <p className="mt-1 flex-1 text-[13px] leading-5 text-ink-soft">{deal.detail}</p>

                      {first && (
                        <Link
                          href={`/product/${first.id}`}
                          className="link-draw mt-4 self-start text-[13px] font-bold text-brand-green"
                        >
                          Shop this offer
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Coupons */}
        <section className="card p-6">
          <h2 className="mb-1 text-[22px] font-extrabold text-white">Coupon codes</h2>
          <p className="mb-5 text-[13px] text-ink-faint">Enter any of these at checkout.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {coupons.map((c) => (
              <div
                key={c.code}
                className="rounded-xl border border-dashed border-brand-green/50 bg-brand-green/10 p-5 transition-colors hover:border-brand-green"
              >
                {/* Labelled so the code reads as something to type at checkout
                    rather than as the offer's name. */}
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink-faint">
                  Promo code
                </p>
                <p className="mt-1 font-mono text-xl font-extrabold tracking-widest text-brand-green">{c.code}</p>
                <p className="mt-1.5 text-[13px] leading-5 text-ink-soft">{c.description}</p>
                {c.minSpend != null && (
                  <p className="mt-1 text-[11px] font-semibold text-ink-faint">
                    Minimum spend ${c.minSpend.toFixed(2)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Discounted products */}
        <section className="card p-6">
          <h2 className="mb-5 text-[22px] font-extrabold text-white">Everything on offer</h2>
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
