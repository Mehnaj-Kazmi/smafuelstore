import Link from "next/link";
import type { Metadata } from "next";
import { Panel, Pill, Stat, Table, Bar } from "@/components/admin/Ui";
import { inventoryStatus, unitsSold } from "@/lib/analytics";
import { products, stockState } from "@/lib/catalog";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Inventory" };

export default function InventoryPage() {
  const inv = inventoryStatus();
  const maxStock = Math.max(...products.map((p) => p.stock), 1);
  const needsAttention = [...inv.out, ...inv.low];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Stock on hand" value={money(inv.value)} sub="retail value" />
        <Stat label="In stock" value={String(inv.ok)} tone="good" sub="healthy levels" />
        <Stat label="Low stock" value={String(inv.low.length)} tone="warn" sub="at or below reorder point" />
        <Stat label="Out of stock" value={String(inv.out.length)} tone={inv.out.length ? "bad" : "good"} sub="needs restocking" />
      </div>

      {needsAttention.length > 0 && (
        <Panel title="Restock queue">
          <Table head={["Product", "SKU", "On hand", "Reorder at", "Sold/day", "Status"]}>
            {needsAttention.map((p) => (
              <tr key={p.id}>
                <td className="py-2 pr-4"><Link href={`/product/${p.id}`} className="hover:text-sma-link-hover">{p.title}</Link></td>
                <td className="py-2 pr-4 font-mono text-xs">{p.sku}</td>
                <td className="py-2 pr-4 tabular-nums">{p.stock}</td>
                <td className="py-2 pr-4 tabular-nums">{p.lowStockAt}</td>
                <td className="py-2 pr-4 tabular-nums">{unitsSold(p)}</td>
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
                  <Link href={`/product/${p.id}`} className="line-clamp-1 hover:text-sma-link-hover">{p.title}</Link>
                  <span className="text-[11px] text-sma-muted">{p.unit}</span>
                </td>
                <td className="py-2 pr-4 font-mono text-xs">{p.sku}</td>
                <td className="py-2 pr-4 font-mono text-xs text-sma-muted">{p.barcode}</td>
                <td className="py-2 pr-4 tabular-nums">{p.stock}</td>
                <td className="w-[20%] py-2 pr-4">
                  <Bar value={p.stock} max={maxStock} tone={state === "out" ? "#b12704" : state === "low" ? "#c45500" : "#067d62"} />
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
