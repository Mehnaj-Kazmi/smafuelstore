"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bar, Columns, Panel, Stat, Table } from "@/components/admin/Ui";
import { money as fmt } from "@/lib/format";
import { departmentMap } from "@/lib/catalog";
import { orderStats, type OrderStats } from "@/lib/orders-api";
import { bestSellers, departmentBreakdown, revenueSeries, summarise } from "@/lib/admin-stats";

export default function ReportsClient() {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setStats(await orderStats());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load reports");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const s = useMemo(() => summarise(stats), [stats]);
  const series = useMemo(() => revenueSeries(stats, 30), [stats]);
  const top = useMemo(() => bestSellers(stats, 10), [stats]);
  const depts = useMemo(() => departmentBreakdown(stats), [stats]);
  const maxDept = Math.max(...depts.map((d) => d.revenue), 1);
  const maxUnits = Math.max(...top.map((t) => t.units), 1);
  const empty = loaded && s.orderCount === 0;

  return (
    <div className="space-y-5">
      {error && <p role="alert" className="text-[13px] font-semibold text-sma-deal">{error}</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Daily sales" value={fmt(s.today.revenue)} sub={`${s.today.orders} orders`} tone="good" />
        <Stat label="Weekly sales" value={fmt(s.week.revenue)} sub={`${s.week.orders} orders`} />
        <Stat label="Monthly sales" value={fmt(s.month.revenue)} sub={`${s.month.orders} orders`} />
        <Stat label="Average order" value={fmt(s.averageOrderMonth)} sub="30-day average" />
      </div>

      <Panel title="Revenue — last 30 days">
        {empty ? <Empty /> : <Columns data={series} />}
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Best sellers">
          {top.length === 0 ? (
            <Empty />
          ) : (
            <Table head={["Product", "Units", "Revenue", ""]}>
              {top.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 pr-4">
                    <Link href={`/product/${row.id}`} className="line-clamp-1 hover:text-brand-green">{row.title}</Link>
                  </td>
                  <td className="py-2 pr-4 tabular-nums">{row.units}</td>
                  <td className="py-2 pr-4 tabular-nums">{fmt(row.revenue)}</td>
                  <td className="w-32 py-2"><Bar value={row.units} max={maxUnits} /></td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>

        <Panel title="Revenue by department">
          {depts.length === 0 ? (
            <Empty />
          ) : (
            <Table head={["Department", "Units", "Revenue", "Share"]}>
              {depts.map((d) => (
                <tr key={d.slug}>
                  <td className="py-2 pr-4">
                    {departmentMap[d.slug as keyof typeof departmentMap]?.name ?? d.slug}
                  </td>
                  <td className="py-2 pr-4 tabular-nums">{d.units}</td>
                  <td className="py-2 pr-4 tabular-nums">{fmt(d.revenue)}</td>
                  <td className="w-32 py-2"><Bar value={d.revenue} max={maxDept} /></td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <p className="py-8 text-center text-[13px] text-ink-faint">
      No orders yet — reports fill in as customers check out.
    </p>
  );
}
