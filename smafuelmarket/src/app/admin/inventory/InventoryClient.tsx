"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Panel, Pill, Stat, Table, Bar } from "@/components/admin/Ui";
import { stockState } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import { money as fmt } from "@/lib/format";
import { orderStats, type OrderStats } from "@/lib/orders-api";

export default function InventoryClient() {
  const { products } = useCatalog();
  const [stats, setStats] = useState<OrderStats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setStats(await orderStats());
      } catch {
        /* Sold-per-day is supporting detail; the stock figures stand without it. */
      }
    })();
  }, []);

  /* Units actually sold per product over the last 30 days, from real orders. */
  const soldPerDay = useMemo(() => {
    const cutoff = Date.now() - 30 * 86_400_000;
    const tally = new Map<string, number>();
    for (const o of stats?.orders ?? []) {
      if (new Date(o.placedAt).getTime() < cutoff) continue;
      for (const i of o.items) {
        tally.set(i.product.id, (tally.get(i.product.id) ?? 0) + i.quantity);
      }
    }
    return (id: string) => Math.round(((tally.get(id) ?? 0) / 30) * 10) / 10;
  }, [stats]);

  const inv = useMemo(() => {
    const out = products.filter((p) => stockState(p) === "out");
    const low = products.filter((p) => stockState(p) === "low");
    const ok = products.length - out.length - low.length;
    const value = products.reduce((n, p) => n + p.price * p.stock, 0);
    return { out, low, ok, value };
  }, [products]);

  const maxStock = Math.max(...products.map((p) => p.stock), 1);
  const needsAttention = [...inv.out, ...inv.low];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Stock on hand" value={fmt(inv.value)} sub="retail value" />
        <Stat label="In stock" value={String(inv.ok)} tone="good" sub="healthy levels" />
        <Stat label="Low stock" value={String(inv.low.length)} tone="warn" sub="at or below reorder point" />
        <Stat label="Out of stock" value={String(inv.out.length)} tone={inv.out.length ? "bad" : "good"} sub="needs restocking" />
      </div>

      {needsAttention.length > 0 && (
        <Panel title="Restock queue">
          <Table head={["Product", "SKU", "On hand", "Reorder at", "Sold/day", "Status"]}>
            {needsAttention.map((p) => (
              <tr key={p.id}>
                <td className="py-2 pr-4"><Link href={`/product/${p.id}`} className="hover:text-brand-green">{p.title}</Link></td>
                <td className="py-2 pr-4 font-mono text-xs">{p.sku}</td>
                <td className="py-2 pr-4 tabular-nums">{p.stock}</td>
                <td className="py-2 pr-4 tabular-nums">{p.lowStockAt}</td>
                <td className="py-2 pr-4 tabular-nums">{soldPerDay(p.id)}</td>
                <td className="py-2">
                  {stockState(p) === "out" ? <Pill tone="bad">Out of stock</Pill> : <Pill tone="warn">Low</Pill>}
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      <Panel title="All inventory">
        <Table head={["Product", "SKU", "Barcode", "On hand", "Level", "Status"]}>
          {products.map((p) => {
            const state = stockState(p);
            return (
              <tr key={p.id}>
                <td className="py-2 pr-4">
                  <Link href={`/product/${p.id}`} className="line-clamp-1 hover:text-brand-green">{p.title}</Link>
                  <span className="text-[11px] text-ink-faint">{p.unit}</span>
                </td>
                <td className="py-2 pr-4 font-mono text-xs">{p.sku}</td>
                <td className="py-2 pr-4 font-mono text-xs text-ink-faint">{p.barcode}</td>
                <td className="py-2 pr-4 tabular-nums">{p.stock}</td>
                <td className="w-[20%] py-2 pr-4">
                  <Bar value={p.stock} max={maxStock} tone={state === "out" ? "#ff4d55" : state === "low" ? "#f37021" : "var(--color-brand-green)"} />
                </td>
                <td className="py-2">
                  {state === "out" ? <Pill tone="bad">Out</Pill> : state === "low" ? <Pill tone="warn">Low</Pill> : <Pill tone="good">OK</Pill>}
                </td>
              </tr>
            );
          })}
        </Table>
      </Panel>
    </div>
  );
}
