"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { categoryMap, departmentMap, discountPercent, stockState, type Product } from "@/lib/catalog";
import { dealsForProduct, dealKindClass, dealKindLabel } from "@/lib/deals";
import { useDeals } from "@/lib/deals-context";
import { money, priceParts } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useDelivery } from "@/lib/delivery";
import { useAuthGate } from "@/lib/auth-gate";
import { useToast } from "@/lib/toast";
import ProductArt from "./ProductArt";
import ProductImage from "./ProductImage";
import StarRating from "./StarRating";
import WishlistButton from "./WishlistButton";

function ratingBreakdown(rating: number): number[] {
  const w = [5, 4, 3, 2, 1].map((s) => Math.max(0.5, 6 - Math.abs(s - rating) * 3));
  const total = w.reduce((a, b) => a + b, 0);
  return w.map((x) => Math.round((x / total) * 100));
}

export default function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const router = useRouter();
  const { add, items, remove, setQuantity: setCartQuantity } = useCart();
  const { canOrder, store } = useDelivery();
  const { requireAuth } = useAuthGate();
  const { notify } = useToast();
  const [quantity, setQuantity] = useState(1);

  const { whole, cents } = priceParts(product.price);
  const off = discountPercent(product);
  const department = departmentMap[product.department];
  const category = categoryMap[product.category];
  const stock = stockState(product);
  const productDeals = dealsForProduct(product.id, useDeals());
  const breakdown = ratingBreakdown(product.rating);
  const soldOut = stock === "out";
  const blocked = soldOut || !canOrder;

  function addToCart() {
    if (blocked) return;
    if (!requireAuth("cart")) return;

    /* Captured first so Undo restores the previous quantity rather than
       assuming the product was not already in the basket. */
    const before = items.find((i) => i.productId === product.id)?.quantity ?? 0;
    add(product.id, quantity);

    notify({
      message: "Added to basket",
      detail: `${quantity} × ${product.title}`,
      tone: "good",
      action: {
        label: "Undo",
        run: () => (before === 0 ? remove(product.id) : setCartQuantity(product.id, before)),
      },
    });
  }

  function buyNow() {
    if (blocked) return;
    if (!requireAuth("buy")) return;
    add(product.id, quantity);
    router.push("/checkout");
  }

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6">
      <nav className="mb-4 text-xs text-ink-faint" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-brand-green">Home</Link>
        <span className="mx-1.5">›</span>
        <Link href={`/department/${department.slug}`} className="transition-colors hover:text-brand-green">
          {department.name}
        </Link>
        <span className="mx-1.5">›</span>
        <span className="text-ink-soft">{category?.name ?? product.category}</span>
      </nav>

      <div className="card p-5">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_minmax(0,3fr)]">
          <div className="self-start overflow-hidden rounded-2xl border border-line bg-surface-2">
            <ProductImage
              imageUrl={product.imageUrl}
              art={product.art}
              hue={product.hue}
              alt={product.title}
              eager
              className="aspect-square w-full"
            />
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              {productDeals.map((d) => (
                <span
                  key={d.id}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${dealKindClass[d.kind]}`}
                >
                  {dealKindLabel[d.kind]} — {d.title}
                </span>
              ))}
            </div>

            <h1 className="text-2xl font-extrabold leading-tight text-white sm:text-[32px]">{product.title}</h1>
            <p className="mt-1 text-sm text-ink-faint">{product.unit}</p>
            <Link
              href={`/shop?q=${encodeURIComponent(product.brand)}`}
              className="link-draw mt-1 inline-block text-[13px] font-bold text-brand-green"
            >
              More from {product.brand}
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-white">{product.rating.toFixed(1)}</span>
              <StarRating rating={product.rating} size={16} />
              <a href="#reviews" className="link-draw text-[13px] font-bold text-brand-green">
                {product.reviews.toLocaleString()} ratings
              </a>
            </div>

            <hr className="my-5 border-line" />

            <div className="flex flex-wrap items-baseline gap-3">
              {off !== null && (
                <span className="rounded-lg bg-sma-deal/15 px-2 py-1 text-xl font-bold text-sma-deal">-{off}%</span>
              )}
              <span className="text-white">
                <span className="align-super text-sm">$</span>
                <span className="text-[34px] font-extrabold tracking-tight">{whole}</span>
                <span className="align-super text-sm">{cents}</span>
              </span>
            </div>
            {product.listPrice && (
              <p className="text-[13px] text-ink-faint">
                Was <span className="line-through">{money(product.listPrice)}</span>
              </p>
            )}

            {product.ageRestricted && (
              <p className="mt-4 rounded-xl border border-brand-orange/35 bg-brand-orange/10 p-3.5 text-[13px] leading-5 text-[#ffc38c]">
                <strong className="text-white">Age-restricted item.</strong> Photo ID is required at handover. Our
                driver will refuse delivery without it, and the item will be refunded.
              </p>
            )}

            <ul className="mt-5 list-disc space-y-2 pl-5 text-[13px] leading-5 text-ink-soft marker:text-brand-green">
              {product.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>

            <div className="mt-5 rounded-xl border border-line bg-surface-2 p-4 text-[13px] leading-6">
              <h2 className="mb-1.5 text-sm font-extrabold text-white">About this item</h2>
              <p className="text-ink-soft">{product.description}</p>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:max-w-md">
              <Spec label="SKU" value={product.sku} />
              <Spec label="Barcode" value={product.barcode} />
              <Spec label="Department" value={department.name} />
              <Spec label="Brand" value={product.brand} />
            </dl>
          </div>

          <div className="lg:sticky lg:top-[96px] lg:self-start">
            <div className="rounded-2xl border border-line bg-surface-2 p-5">
              <p className="text-white">
                <span className="align-super text-xs">$</span>
                <span className="text-[28px] font-extrabold tracking-tight">{whole}</span>
                <span className="align-super text-xs">{cents}</span>
              </p>

              <p
                className={`mt-2 text-lg font-bold ${
                  stock === "out" ? "text-sma-deal" : stock === "low" ? "text-brand-orange" : "text-brand-green"
                }`}
              >
                {stock === "out" ? "Out of stock" : stock === "low" ? `Only ${product.stock} left` : "In stock"}
              </p>

              {canOrder ? (
                <p className="mt-1 text-[13px] leading-5 text-ink-soft">
                  Delivered in about <strong className="text-white">30 minutes</strong> from {store.name}.
                </p>
              ) : (
                <p className="mt-1 text-[13px] leading-5 text-brand-orange">
                  You&apos;re outside our delivery area, so ordering is unavailable. You can still browse and save
                  items.
                </p>
              )}

              <label className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
                Quantity:
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  disabled={soldOut}
                  className="cursor-pointer rounded-lg border border-line bg-surface-3 px-3 py-1.5 font-bold text-white outline-none transition-colors focus:border-brand-green disabled:opacity-50"
                >
                  {Array.from({ length: Math.min(10, Math.max(1, product.stock)) }).map((_, i) => (
                    <option key={i} value={i + 1} className="bg-surface-3 text-white">
                      {i + 1}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={blocked}
                  className="btn-pill btn-cart w-full py-3 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {soldOut ? "Out of stock" : canOrder ? "Add to cart" : "Outside delivery area"}
                </button>
                <button
                  type="button"
                  onClick={buyNow}
                  disabled={blocked}
                  className="btn-pill btn-buy w-full py-3 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Buy now
                </button>
                <WishlistButton
                  productId={product.id}
                  withLabel
                  className="btn-pill btn-ghost w-full justify-center py-3"
                />
              </div>

              <dl className="mt-5 space-y-1.5 text-xs text-ink-faint">
                <Row label="Ships from" value={store.name} />
                <Row label="Sold by" value="SMA Fuel & Market" />
                <Row label="Returns" value="Refund on damaged or wrong items" />
              </dl>
            </div>
          </div>
        </div>
      </div>

      <section id="reviews" className="card mt-6 p-6">
        <h2 className="mb-5 text-[22px] font-extrabold text-white">Customer reviews</h2>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div>
            <div className="flex items-center gap-2">
              <StarRating rating={product.rating} size={18} />
              <span className="text-lg font-bold text-white">{product.rating.toFixed(1)} out of 5</span>
            </div>
            <p className="mb-4 mt-1 text-[13px] text-ink-faint">{product.reviews.toLocaleString()} ratings</p>
            {[5, 4, 3, 2, 1].map((star, i) => (
              <div key={star} className="flex items-center gap-2 py-0.5 text-[13px]">
                <span className="w-12 shrink-0 font-semibold text-ink-soft">{star} star</span>
                <span className="h-5 flex-1 overflow-hidden rounded-md border border-line bg-surface-3">
                  <span
                    className="block h-full rounded-md bg-brand-green transition-[width] duration-700"
                    style={{ width: `${breakdown[i]}%` }}
                  />
                </span>
                <span className="w-9 shrink-0 text-right text-ink-faint">{breakdown[i]}%</span>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {sampleReviews(product).map((r) => (
              <article key={r.name} className="border-b border-line pb-6 last:border-0">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-3 text-xs font-extrabold text-white">
                    {r.name.charAt(0)}
                  </span>
                  <span className="text-[13px] font-semibold text-ink-soft">{r.name}</span>
                </div>
                <div className="mb-1.5 flex items-center gap-2">
                  <StarRating rating={r.stars} />
                  <span className="text-[13px] font-bold text-white">{r.headline}</span>
                </div>
                <p className="mb-1.5 text-xs text-ink-faint">
                  {r.date} · <span className="font-bold text-brand-green">Verified purchase</span>
                </p>
                <p className="text-[13px] leading-6 text-ink-soft">{r.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="card mt-6 p-6">
          <h2 className="mb-5 text-[22px] font-extrabold text-white">Often bought together</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className="group block">
                <div className="overflow-hidden rounded-xl border border-line bg-surface-2">
                  <ProductImage
                    imageUrl={p.imageUrl}
                    art={p.art}
                    hue={p.hue}
                    alt={p.title}
                    className="aspect-square w-full transition-transform duration-500 group-hover:scale-[1.07]"
                  />
                </div>
                <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-4 text-ink-soft transition-colors group-hover:text-brand-green">
                  {p.title}
                </p>
                <p className="mt-1 text-sm font-bold text-white">{money(p.price)}</p>
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
      <dt className="font-semibold text-ink-soft">{label}</dt>
      <dd className="font-mono text-[11px] text-white">{value}</dd>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0">{label}</dt>
      <dd className="text-ink-soft">{value}</dd>
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
