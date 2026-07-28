"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart";
import { orderFlow, orderStatusLabel, type Order } from "@/lib/orders";
import { money } from "@/lib/format";
import { useCatalog } from "@/lib/catalog-context";
import ProductArt from "@/components/ProductArt";

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1100px] px-4 py-10 text-sm text-sma-muted">Loading…</div>}>
      <OrdersView />
    </Suspense>
  );
}

function OrdersView() {
  const params = useSearchParams();
  const justPlaced = params.get("placed");
  const { orders, hydrated } = useCart();

  if (!hydrated) {
    return <div className="mx-auto max-w-[1100px] px-4 py-10 text-sm text-sma-muted">Loading your orders…</div>;
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5">
      {justPlaced && (
        <div className="mb-5 rounded-lg border border-[#007600] bg-surface p-5">
          <h1 className="text-2xl font-bold text-[#007600]">Order confirmed</h1>
          <p className="mt-1 text-sm">
            Order <span className="font-bold">{justPlaced}</span> is being prepared. You&apos;ll get a notification
            when the driver leaves the store.
          </p>
          <p className="mt-1 text-sm text-sma-muted">Estimated arrival: about 30 minutes.</p>
        </div>
      )}

      <h2 className="mb-4 text-[28px] font-medium">Your orders</h2>

      {orders.length === 0 ? (
        <div className="bg-surface p-10 text-center">
          <p className="text-lg font-bold">No orders yet</p>
          <p className="mt-1 text-sm text-sma-muted">Orders you place will show up here with live tracking.</p>
          <Link href="/shop" className="btn-pill btn-cart mt-4 inline-block font-medium">Start shopping</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => <OrderCard key={order.id} order={order} />)}
        </ul>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const { getProduct } = useCatalog();

  const stepIndex = orderFlow.indexOf(order.status);

  return (
    <li className="rounded-lg border border-sma-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-t-lg border-b border-sma-border bg-[#f0f2f2] px-5 py-3 text-xs">
        <div className="flex flex-wrap gap-6">
          <span>
            <span className="block uppercase tracking-wide text-sma-muted">Order placed</span>
            <span className="block text-[13px]">
              {new Date(order.placedAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </span>
          <span>
            <span className="block uppercase tracking-wide text-sma-muted">Total</span>
            <span className="block text-[13px]">{money(order.total)}</span>
          </span>
          <span>
            <span className="block uppercase tracking-wide text-sma-muted">Deliver to</span>
            <span className="block max-w-[220px] truncate text-[13px]">{order.address}</span>
          </span>
        </div>
        <span className="text-right">
          <span className="block uppercase tracking-wide text-sma-muted">Order #</span>
          <span className="block font-mono text-[13px]">{order.id}</span>
        </span>
      </div>

      <div className="px-5 py-4">
        {/* Status tracker */}
        {order.status !== "cancelled" ? (
          <ol className="mb-5 flex flex-wrap gap-y-3">
            {orderFlow.map((step, i) => {
              const done = i <= stepIndex;
              return (
                <li key={step} className="flex min-w-[110px] flex-1 flex-col gap-1.5">
                  <span className="flex items-center gap-1">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${done ? "bg-[#007600]" : "bg-sma-border"}`} />
                    <span className={`h-[3px] flex-1 rounded ${i < stepIndex ? "bg-[#007600]" : "bg-sma-border"} ${i === orderFlow.length - 1 ? "opacity-0" : ""}`} />
                  </span>
                  <span className={`text-[11px] leading-3 ${done ? "font-bold" : "text-sma-muted"}`}>
                    {orderStatusLabel[step]}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mb-4 text-sm font-bold text-sma-deal">This order was cancelled.</p>
        )}

        <ul className="space-y-4">
          {order.lines.map((line) => {
            const product = getProduct(line.productId);
            if (!product) return null;
            return (
              <li key={line.productId} className="flex gap-4">
                <Link href={`/product/${product.id}`} className="shrink-0">
                  <ProductArt art={product.art} hue={product.hue} className="h-20 w-20 rounded-md" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${product.id}`} className="line-clamp-2 text-sm text-sma-link hover:text-sma-link-hover hover:underline">
                    {product.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-sma-muted">
                    {product.unit} · Qty {line.quantity} · {money(product.price)} each
                  </p>
                  <Link href={`/product/${product.id}`} className="btn-pill mt-2 inline-block bg-surface text-[13px] font-medium hover:bg-gray-50">
                    Buy it again
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

        <dl className="mt-4 border-t border-sma-border pt-3 text-[13px]">
          <div className="flex justify-between"><dt className="text-sma-muted">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-sma-muted">Coupon {order.couponCode}</dt>
              <dd className="text-[#007600]">−{money(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between"><dt className="text-sma-muted">Delivery</dt><dd>{order.deliveryFee === 0 ? "FREE" : money(order.deliveryFee)}</dd></div>
          <div className="flex justify-between"><dt className="text-sma-muted">Tax</dt><dd>{money(order.tax)}</dd></div>
          <div className="mt-1 flex justify-between font-bold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
        </dl>
      </div>
    </li>
  );
}
