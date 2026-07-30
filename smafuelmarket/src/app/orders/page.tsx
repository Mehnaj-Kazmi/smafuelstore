"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { orderFlow, orderStatusLabel } from "@/lib/orders";
import { money as fmt } from "@/lib/format";
import { myOrders, money, toStatus, type ApiOrder } from "@/lib/orders-api";
import ProductImage from "@/components/ProductImage";
import type { ArtKey } from "@/lib/catalog";

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1100px] px-4 py-10 text-sm text-ink-faint">Loading…</div>}>
      <OrdersView />
    </Suspense>
  );
}

function OrdersView() {
  const params = useSearchParams();
  const justPlaced = params.get("placed");
  const { user, hydrated: authReady } = useAuth();

  const [orders, setOrders] = useState<ApiOrder[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setOrders(await myOrders());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your orders");
    }
  }, []);

  useEffect(() => {
    if (authReady && user) void load();
  }, [authReady, user, load]);

  if (!authReady) {
    return <div className="mx-auto max-w-[1100px] px-4 py-10 text-sm text-ink-faint">Loading…</div>;
  }

  /* Orders live on the account now, so there is nothing to show a signed-out
     visitor — the old local-storage list belonged to the browser, not a person. */
  if (!user) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-white">Sign in to see your orders</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-faint">
          Your orders are kept with your account, so they follow you to any device.
        </p>
        <Link href="/signin?next=%2Forders" className="btn-pill btn-cart mt-5 inline-block">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6">
      {justPlaced && (
        <div className="mb-6 rounded-xl border border-brand-green/40 bg-brand-green/10 p-5">
          <h1 className="text-2xl font-extrabold text-brand-green">Order confirmed</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Order <span className="font-mono font-bold text-white">#{justPlaced.padStart(6, "0")}</span> is
            being prepared. You&apos;ll get a notification when the driver leaves the store.
          </p>
          <p className="mt-1 text-sm text-ink-faint">Estimated arrival: about 30 minutes.</p>
        </div>
      )}

      <h2 className="mb-5 text-[28px] font-extrabold text-white">Your orders</h2>

      {error && <p role="alert" className="mb-4 text-[13px] font-semibold text-sma-deal">{error}</p>}

      {!orders ? (
        <p className="text-sm text-ink-faint">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-lg font-extrabold text-white">No orders yet</p>
          <p className="mt-1 text-sm text-ink-faint">Orders you place will show up here with live tracking.</p>
          <Link href="/shop" className="btn-pill btn-cart mt-4 inline-block">Start shopping</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => <OrderCard key={order.id} order={order} />)}
        </ul>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: ApiOrder }) {
  const status = toStatus(order.status);
  const stepIndex = orderFlow.indexOf(status);
  const placed = new Date(order.placedAt);

  return (
    <li className="card p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
        <span>
          <span className="block text-[11px] uppercase tracking-wider text-ink-faint">Order placed</span>
          <span className="block text-sm font-semibold text-white">
            {placed.toLocaleDateString()} · {placed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </span>
        <span>
          <span className="block text-[11px] uppercase tracking-wider text-ink-faint">Total</span>
          <span className="block text-sm font-bold text-white">{fmt(money(order.total))}</span>
        </span>
        <span className="text-right">
          <span className="block text-[11px] uppercase tracking-wider text-ink-faint">Order</span>
          <span className="block font-mono text-sm text-ink-soft">#{String(order.id).padStart(6, "0")}</span>
        </span>
      </div>

      {status !== "cancelled" ? (
        <ol className="mb-5 flex gap-1">
          {orderFlow.map((step, i) => {
            const done = i <= stepIndex;
            return (
              <li key={step} className="flex-1">
                <span className="flex items-center gap-1">
                  <span className={`h-3 w-3 shrink-0 rounded-full ${done ? "bg-brand-green" : "bg-surface-3"}`} />
                  <span
                    className={`h-[3px] flex-1 rounded ${i < stepIndex ? "bg-brand-green" : "bg-surface-3"} ${
                      i === orderFlow.length - 1 ? "opacity-0" : ""
                    }`}
                  />
                </span>
                <span className={`text-[11px] leading-3 ${done ? "font-bold text-white" : "text-ink-faint"}`}>
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
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-4">
            <Link href={`/product/${item.product.id}`} className="shrink-0">
              <ProductImage
                imageUrl={item.product.imageUrl}
                art={item.product.art as ArtKey}
                hue={item.product.hue}
                alt={item.product.title}
                className="h-20 w-20 rounded-md"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/product/${item.product.id}`} className="line-clamp-2 text-sm font-semibold text-white hover:text-brand-green">
                {item.product.title}
              </Link>
              <p className="text-xs text-ink-faint">{item.product.unit}</p>
              <p className="mt-1 text-[13px] text-ink-soft">
                Qty {item.quantity} · {fmt(money(item.unitPrice))} each
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-white">
              {fmt(money(item.unitPrice) * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-5 space-y-1 border-t border-line pt-4 text-[13px]">
        <Row label="Items" value={fmt(money(order.subtotal))} />
        {money(order.discount) > 0 && (
          <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`−${fmt(money(order.discount))}`} tone="green" />
        )}
        <Row label="Delivery" value={money(order.deliveryFee) === 0 ? "Free" : fmt(money(order.deliveryFee))} />
        <Row label="Tax" value={fmt(money(order.tax))} />
        <Row label="Total" value={fmt(money(order.total))} strong />
      </dl>

      {order.address && (
        <p className="mt-4 text-xs text-ink-faint">
          Delivering to {order.address.recipient ? `${order.address.recipient}, ` : ""}
          {order.address.line1}, {order.address.city} {order.address.zip}
          {order.address.notes ? ` — ${order.address.notes}` : ""}
        </p>
      )}
    </li>
  );
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "green" }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={strong ? "font-bold text-white" : "text-ink-faint"}>{label}</dt>
      <dd className={`tabular-nums ${tone === "green" ? "text-brand-green" : strong ? "font-bold text-white" : "text-ink-soft"}`}>
        {value}
      </dd>
    </div>
  );
}
