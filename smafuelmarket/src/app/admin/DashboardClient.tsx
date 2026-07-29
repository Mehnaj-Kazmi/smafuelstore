"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Stat, Panel, Table, Pill, Bar, Columns } from "@/components/admin/Ui";
import { money as fmt } from "@/lib/format";
import { departmentMap, stockState, type Product } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import { allOrders, money, orderStats, type ApiOrder, type OrderStats } from "@/lib/orders-api";
import { bestSellers, departmentBreakdown, revenueSeries, summarise } from "@/lib/admin-stats";

const statusTone: Record<string, "good" | "warn" | "bad" | "info" | "muted"> = {
  PENDING: "warn",
  CONFIRMED: "info",
  PREPARING: "info",
  OUT_FOR_DELIVERY: "info",
  DELIVERED: "good",
  CANCELLED: "bad",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function DashboardClient() {
  const { products } = useCatalog();
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, o] = await Promise.all([orderStats(), allOrders()]);
        setStats(s);
        setOrders(o);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load dashboard data");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const s = useMemo(() => summarise(stats), [stats]);
  const series = useMemo(() => revenueSeries(stats, 14), [stats]);
  const top = useMemo(() => bestSellers(stats, 6), [stats]);
  const depts = useMemo(() => departmentBreakdown(stats), [stats]);
  const maxDept = Math.max(...depts.map((d) => d.revenue), 1);

  /* Inventory comes from the live catalogue rather than orders. */
  const inv = useMemo(() => {
    const out: Product[] = [];
    const low: Product[] = [];
    for (const p of products) {
      const state = stockState(p);
      if (state === "out") out.push(p);
      else if (state === "low") low.push(p);
    }
    return { out, low };
  }, [products]);

  const totalRevenue = s.month.revenue;

  return (
    <div className="space-y-5">
      {error && <p role="alert" className="text-[13px] font-semibold text-sma-deal">{error}</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Today's revenue" value={fmt(s.today.revenue)} sub={`${s.today.orders} orders`} tone="good" />
        <Stat label="This week" value={fmt(s.week.revenue)} sub={`${s.week.orders} orders`} />
        <Stat label="Average order" value={fmt(s.averageOrder)} sub="all time" />
        <Stat label="Registered customers" value={String(s.customers)} sub={`${s.today.units} units sold today`} />
        <Stat
          label="Needs attention"
          value={String(inv.out.length + inv.low.length)}
          sub={`${inv.out.length} out, ${inv.low.length} low`}
          tone={inv.out.length > 0 ? "bad" : inv.low.length > 0 ? "warn" : "good"}
        />
      </div>

      <Panel title="Revenue — last 14 days">
        {loaded && s.orderCount === 0 ? (
          <EmptyState />
        ) : (
          <Columns data={series} />
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel
          title="Live orders"
          action={<Link href="/admin/orders" className="link-draw text-[13px] font-bold text-brand-green">All orders</Link>}
        >
          {orders.length === 0 ? (
            <p className="text-[13px] text-ink-faint">
              {loaded ? "No orders yet — they appear here the moment a customer checks out." : "Loading…"}
            </p>
          ) : (
            <Table head={["Order", "Customer", "Items", "Total", "Status"]}>
              {orders.slice(0, 6).map((o) => (
                <tr key={o.id}>
                  <td className="py-2 pr-4 font-mono text-xs text-white">{o.id.slice(-8).toUpperCase()}</td>
                  <td className="py-2 pr-4">{o.user?.name ?? "—"}</td>
                  <td className="py-2 pr-4 tabular-nums">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td className="py-2 pr-4 tabular-nums">{fmt(money(o.total))}</td>
                  <td className="py-2">
                    <Pill tone={statusTone[o.status] ?? "muted"}>{statusLabel[o.status] ?? o.status}</Pill>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>

        <Panel
          title="Best sellers"
          action={<Link href="/admin/reports" className="link-draw text-[13px] font-bold text-brand-green">Reports</Link>}
        >
          {top.length === 0 ? (
            <p className="text-[13px] text-ink-faint">{loaded ? "Nothing sold yet." : "Loading…"}</p>
          ) : (
            <Table head={["Product", "Units", "Revenue"]}>
              {top.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 pr-4">
                    <Link href={`/product/${row.id}`} className="line-clamp-1 hover:text-brand-green">{row.title}</Link>
                  </td>
                  <td className="py-2 pr-4 tabular-nums">{row.units}</td>
                  <td className="py-2 tabular-nums">{fmt(row.revenue)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>

      <Panel title="Revenue by department">
        {depts.length === 0 ? (
          <p className="text-[13px] text-ink-faint">{loaded ? "Nothing sold yet." : "Loading…"}</p>
        ) : (
          <Table head={["Department", "Units", "Revenue", "Share"]}>
            {depts.map((d) => (
              <tr key={d.slug}>
                <td className="py-2 pr-4">
                  <Link href={`/department/${d.slug}`} className="hover:text-brand-green">
                    {departmentMap[d.slug as keyof typeof departmentMap]?.name ?? d.slug}
                  </Link>
                </td>
                <td className="py-2 pr-4 tabular-nums">{d.units}</td>
                <td className="py-2 pr-4 tabular-nums">{fmt(d.revenue)}</td>
                <td className="w-40 py-2">
                  <Bar value={d.revenue} max={maxDept} />
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      {totalRevenue === 0 && loaded && (
        <p className="text-[12px] text-ink-faint">
          Figures are calculated from real orders. Place an order on the storefront and it will appear here.
        </p>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <p className="py-8 text-center text-[13px] text-ink-faint">
      No orders yet. This chart fills in as customers check out.
    </p>
  );
}
