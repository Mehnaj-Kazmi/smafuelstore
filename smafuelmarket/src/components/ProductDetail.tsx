"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { categoryMap, departmentMap, discountPercent, stockState, type Product } from "@/lib/catalog";
import { dealsForProduct, dealKindClass, dealKindLabel } from "@/lib/deals";
import { money, priceParts } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useDelivery } from "@/lib/delivery";
import ProductArt from "./ProductArt";
import StarRating from "./StarRating";
import WishlistButton from "./WishlistButton";

function ratingBreakdown(rating: number): number[] {
  const w = [5, 4, 3, 2, 1].map((s) => Math.max(0.5, 6 - Math.abs(s - rating) * 3));
  const total = w.reduce((a, b) => a + b, 0);
  return w.map((x) => Math.round((x / total) * 100));
}

export default function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const router = useRouter();
  const { add } = useCart();
  const { canOrder, store } = useDelivery();
  const [quantity, setQuantity] = useState(1);

  const { whole, cents } = priceParts(product.price);
  const off = discountPercent(product);
  const department = departmentMap[product.department];
  const category = categoryMap[product.category];
  const stock = stockState(product);
  const productDeals = dealsForProduct(product.id);
  const breakdown = ratingBreakdown(product.rating);
  const soldOut = stock === "out";
  const blocked = soldOut || !canOrder;

  function buyNow() {
    if (blocked) return;
    add(product.id, quantity);
    router.push("/checkout");
  }

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-3">
      <nav className="mb-2 text-xs text-sma-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-sma-link-hover hover:underline">Home</Link>
        <span className="mx-1.5">›</span>
        <Link href={`/department/${department.slug}`} className="hover:text-sma-link-hover hover:underline">{department.name}</Link>
        <span className="mx-1.5">›</span>
        <span>{category?.name ?? product.category}</span>
      </nav>

      <div className="bg-white p-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_minmax(0,3fr)]">
          <div className="self-start overflow-hidden rounded-md">
            <ProductArt art={product.art} hue={product.hue} className="aspect-square w-full" />
          </div>

          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap gap-2">
              {productDeals.map((d) => (
                <span key={d.id} className={`rounded px-2 py-0.5 text-[11px] font-bold ${dealKindClass[d.kind]}`}>
                  {dealKindLabel[d.kind]} — {d.title}
                </span>
              ))}
            </div>

            <h1 className="text-xl font-medium leading-7 sm:text-2xl">{product.title}</h1>
            <p className="mt-0.5 text-sm text-sma-muted">{product.unit}</p>
            <Link href={`/shop?q=${encodeURIComponent(product.brand)}`} className="text-[13px] text-sma-link hover:text-sma-link-hover hover:underline">
              More from {product.brand}
            </Link>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-sm">{product.rating.toFixed(1)}</span>
              <StarRating rating={product.rating} size={16} />
              <a href="#reviews" className="text-[13px] text-sma-link hover:text-sma-link-hover hover:underline">
                {product.reviews.toLocaleString()} ratings
              </a>
            </div>

            <hr className="my-3 border-sma-border" />

            <div className="flex flex-wrap items-baseline gap-3">
              {off !== null && <span className="text-2xl font-light text-sma-deal">-{off}%</span>}
              <span>
                <span className="align-super text-sm">$</span>
                <span className="text-[28px] font-medium">{whole}</span>
                <span className="align-super text-sm">{cents}</span>
              </span>
            </div>
            {product.listPrice && (
              <p className="text-[13px] text-sma-muted">
                Was <span className="line-through">{money(product.listPrice)}</span>
              </p>
            )}

            {product.ageRestricted && (
              <p className="mt-3 rounded-md border border-[#f0d4a3] bg-[#fdf3e3] p-3 text-[13px] text-[#7a4a05]">
                <strong>Age-restricted item.</strong> Photo ID is required at handover. Our driver will refuse
                delivery without it, and the item will be refunded.
              </p>
            )}

            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-[13px] leading-5">
              {product.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>

            <div className="mt-4 rounded-md bg-[#f7fafa] p-3 text-[13px] leading-5">
              <h2 className="mb-1 text-sm font-bold">About this item</h2>
              <p>{product.description}</p>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-sma-muted sm:max-w-md">
              <Spec label="SKU" value={product.sku} />
              <Spec label="Barcode" value={product.barcode} />
              <Spec label="Department" value={department.name} />
              <Spec label="Brand" value={product.brand} />
            </dl>
          </div>

          <div className="lg:sticky lg:top-[110px] lg:self-start">
            <div className="rounded-lg border border-sma-border p-4">
              <p>
                <span className="align-super text-xs">$</span>
                <span className="text-[26px] font-medium">{whole}</span>
                <span className="align-super text-xs">{cents}</span>
              </p>

              <p className={`mt-2 text-lg ${stock === "out" ? "text-sma-deal" : stock === "low" ? "text-[#c45500]" : "text-[#007600]"}`}>
                {stock === "out" ? "Out of stock" : stock === "low" ? `Only ${product.stock} left` : "In stock"}
              </p>

              {canOrder ? (
                <p className="mt-1 text-[13px] leading-5">
                  Delivered in about <strong>30 minutes</strong> from {store.name}.
                </p>
              ) : (
                <p className="mt-1 text-[13px] leading-5 text-[#7a4a05]">
                  Ordering is unavailable at your location. You can still browse and save items.
                </p>
              )}

              <label className="mt-3 flex items-center gap-2 text-[13px]">
                Quantity:
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  disabled={soldOut}
                  className="cursor-pointer rounded-md border border-sma-border bg-[#f0f2f2] px-2 py-1 outline-none disabled:opacity-50"
                >
                  {Array.from({ length: Math.min(10, Math.max(1, product.stock)) }).map((_, i) => (
                    <option key={i} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </label>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => !blocked && add(product.id, quantity)}
                  disabled={blocked}
                  className="btn-pill btn-cart w-full font-medium disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {soldOut ? "Out of stock" : canOrder ? "Add to cart" : "Unavailable here"}
                </button>
                <button
                  type="button"
                  onClick={buyNow}
                  disabled={blocked}
                  className="btn-pill btn-buy w-full font-medium disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Buy now
                </button>
                <WishlistButton productId={product.id} withLabel className="btn-pill w-full justify-center bg-white font-medium hover:bg-gray-50" />
              </div>

              <dl className="mt-4 space-y-1 text-xs text-sma-muted">
                <Row label="Ships from" value={store.name} />
                <Row label="Sold by" value="SMA Fuel & Market" />
                <Row label="Returns" value="Refund on damaged or wrong items" />
              </dl>
            </div>
          </div>
        </div>
      </div>

      <section id="reviews" className="mt-4 bg-white p-5">
        <h2 className="mb-4 text-xl font-bold">Customer reviews</h2>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div>
            <div className="flex items-center gap-2">
              <StarRating rating={product.rating} size={18} />
              <span className="text-lg">{product.rating.toFixed(1)} out of 5</span>
            </div>
            <p className="mb-3 mt-1 text-[13px] text-sma-muted">{product.reviews.toLocaleString()} ratings</p>
            {[5, 4, 3, 2, 1].map((star, i) => (
              <div key={star} className="flex items-center gap-2 py-0.5 text-[13px]">
                <span className="w-12 shrink-0 text-sma-link">{star} star</span>
                <span className="h-5 flex-1 overflow-hidden rounded-sm border border-sma-border bg-[#f0f2f2]">
                  <span className="block h-full bg-sma-accent" style={{ width: `${breakdown[i]}%` }} />
                </span>
                <span className="w-9 shrink-0 text-right text-sma-link">{breakdown[i]}%</span>
              </div>
            ))}
          </div>

          <div className="space-y-5">
            {sampleReviews(product).map((r) => (
              <article key={r.name} className="border-b border-sma-border pb-5 last:border-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e3e6e6] text-xs font-bold">
                    {r.name.charAt(0)}
                  </span>
                  <span className="text-[13px]">{r.name}</span>
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <StarRating rating={r.stars} />
                  <span className="text-[13px] font-bold">{r.headline}</span>
                </div>
                <p className="mb-1 text-xs text-sma-muted">
                  {r.date} · <span className="font-medium text-[#c45500]">Verified purchase</span>
                </p>
                <p className="text-[13px] leading-5">{r.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-4 bg-white p-5">
          <h2 className="mb-4 text-xl font-bold">Often bought together</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className="group block">
                <ProductArt art={p.art} hue={p.hue} className="aspect-square w-full rounded-md transition-transform group-hover:scale-[1.04]" />
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-4 group-hover:text-sma-link-hover">{p.title}</p>
                <p className="mt-1 text-sm font-medium">{money(p.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="font-medium">{label}</dt>
      <dd className="font-mono text-[11px]">{value}</dd>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0">{label}</dt>
      <dd className="text-[#0f1111]">{value}</dd>
    </div>
  );
}

/** Deterministic sample feedback so a product always shows the same reviews. */
function sampleReviews(product: Product) {
  const names = ["Ayesha K.", "Daniel R.", "Priya S."];
  const headlines = ["Exactly what I needed", "Good price for the size", "Arrived fast"];
  const bodies = [
    `Grabbed this on the way to work and it was as described. ${product.bullets[0]} — that was the deciding factor over the cheaper option.`,
    `Delivery took about 25 minutes, which beats driving over. ${product.bullets[1] ?? "Matches the listing."}`,
    `Third time ordering ${product.brand} from here. Consistent, and the driver actually checked the bag before handing it over.`,
  ];
  const dates = ["12 June 2026", "28 May 2026", "3 May 2026"];
  const stars = [5, 4.5, 4];
  return names.map((name, i) => ({ name, headline: headlines[i], body: bodies[i], date: dates[i], stars: stars[i] }));
}
