"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useDelivery } from "@/lib/delivery";
import { useAuthGate } from "@/lib/auth-gate";
import { money } from "@/lib/format";
import { stockState } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import ProductArt from "@/components/ProductArt";
import ProductImage from "@/components/ProductImage";
import ProductCard from "@/components/ProductCard";

const FREE_DELIVERY_OVER = 20;

export default function CartPage() {
  const router = useRouter();
  const { items, subtotal, savings, count, setQuantity, remove, clear, hydrated, toggleWish, hasAgeRestricted } = useCart();
  const { canOrder, store } = useDelivery();
  const { requireAuth } = useAuthGate();
  const { products } = useCatalog();

  if (!hydrated) {
    return <div className="mx-auto max-w-[1500px] px-3 py-10 text-sm text-ink-faint">Loading your cart…</div>;
  }

  if (items.length === 0) {
    const suggestions = products.filter((p) => p.tags.includes("impulse") || p.tags.includes("essential")).slice(0, 6);
    return (
      <div className="mx-auto max-w-[1500px] px-3 py-4">
        <div className="flex flex-col items-center gap-4 bg-surface p-10 text-center sm:flex-row sm:text-left">
          <ProductArt art="chips" hue={45} className="h-40 w-40 shrink-0" />
          <div>
            <h1 className="text-2xl font-bold">Your basket is empty</h1>
            <p className="mt-1 text-sm text-ink-faint">
              Everything in the store is available for delivery in about 30 minutes.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/deals" className="btn-pill btn-cart inline-block font-medium">Shop today&apos;s deals</Link>
              <Link href="/shop" className="btn-pill inline-block bg-surface font-medium hover:bg-surface-2">Browse the store</Link>
            </div>
          </div>
        </div>

        <section className="mt-4 bg-surface p-5">
          <h2 className="mb-4 text-xl font-bold">Popular right now</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {suggestions.map((p) => <ProductCard key={p.id} product={p} compact />)}
          </div>
        </section>
      </div>
    );
  }

  const remaining = FREE_DELIVERY_OVER - subtotal;

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="bg-surface p-5">
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-medium sm:text-[28px]">Your basket</h1>
            <button type="button" onClick={clear} className="text-[13px] text-brand-green hover:text-brand-green hover:underline">
              Empty basket
            </button>
          </div>
          <p className="mb-2 border-b border-line pb-2 text-right text-[13px] text-ink-faint">Price</p>

          <ul>
            {items.map((item) => {
              const stock = stockState(item.product);
              return (
                <li key={item.productId} className="flex gap-4 border-b border-line py-4 last:border-0">
                  <Link href={`/product/${item.productId}`} className="shrink-0">
                    <ProductImage
                      imageUrl={item.product.imageUrl}
                      art={item.product.art}
                      hue={item.product.hue}
                      alt={item.product.title}
                      className="h-24 w-24 rounded-md sm:h-32 sm:w-32"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/product/${item.productId}`} className="line-clamp-2 text-base font-medium hover:text-brand-green">
                          {item.product.title}
                        </Link>
                        <p className="text-xs text-ink-faint">{item.product.unit}</p>
                        <p className={`mt-0.5 text-xs ${stock === "low" ? "text-brand-orange" : "text-brand-green"}`}>
                          {stock === "low" ? `Only ${item.product.stock} left` : "In stock"}
                        </p>
                        {item.product.ageRestricted && (
                          <p className="mt-0.5 text-xs font-medium text-brand-orange">Photo ID required at handover</p>
                        )}
                      </div>
                      <p className="shrink-0 text-base font-bold">{money(item.lineTotal)}</p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex items-center rounded-full border border-line shadow-sm">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.productId, item.quantity - 1)}
                          aria-label={`Decrease quantity of ${item.product.title}`}
                          className="px-3 py-1 text-lg leading-5 text-brand-green hover:bg-surface-3"
                        >
                          −
                        </button>
                        <span className="min-w-8 px-2 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          aria-label={`Increase quantity of ${item.product.title}`}
                          className="px-3 py-1 text-lg leading-5 text-brand-green hover:bg-surface-3 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sma-border">|</span>
                      <button type="button" onClick={() => remove(item.productId)} className="text-[13px] text-brand-green hover:text-brand-green hover:underline">
                        Remove
                      </button>
                      <span className="text-sma-border">|</span>
                      <button
                        type="button"
                        onClick={() => { toggleWish(item.productId); remove(item.productId); }}
                        className="text-[13px] text-brand-green hover:text-brand-green hover:underline"
                      >
                        Save for later
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="pt-4 text-right text-lg">
            Subtotal ({count} {count === 1 ? "item" : "items"}): <span className="font-bold">{money(subtotal)}</span>
          </p>
        </div>

        <aside className="lg:sticky lg:top-[110px] lg:self-start">
          <div className="bg-surface p-5">
            {!canOrder ? (
              <p className="mb-3 rounded-md border border-brand-orange/35 bg-brand-orange/10 p-3 text-[13px] leading-5 text-brand-orange">
                <strong>Checkout is unavailable.</strong> We only deliver within {store.radiusMiles} miles of{" "}
                {store.name}. Your basket is saved if you come back inside the area.
              </p>
            ) : remaining > 0 ? (
              <p className="mb-3 text-[13px] leading-5">
                Add <span className="font-bold">{money(remaining)}</span> for free delivery.
              </p>
            ) : (
              <p className="mb-3 text-[13px] leading-5 text-brand-green">Your order qualifies for free delivery.</p>
            )}

            <p className="text-lg">
              Subtotal ({count} {count === 1 ? "item" : "items"}): <span className="font-bold">{money(subtotal)}</span>
            </p>
            {savings > 0 && <p className="mt-1 text-[13px] text-sma-deal">You save {money(savings)}</p>}

            {hasAgeRestricted && (
              <p className="mt-3 text-xs leading-4 text-ink-faint">
                Your basket contains age-restricted items. You&apos;ll confirm your age at checkout and show ID on
                delivery.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                /* Checkout needs an account for the order to belong to, so a
                   signed-out basket is routed through sign in and returned
                   straight to /checkout rather than to the cart. */
                if (!requireAuth("checkout", "/checkout")) return;
                router.push("/checkout");
              }}
              disabled={!canOrder}
              className="btn-pill btn-buy mt-4 w-full font-medium disabled:cursor-not-allowed disabled:opacity-45"
            >
              {canOrder ? "Proceed to checkout" : "Delivery unavailable"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
