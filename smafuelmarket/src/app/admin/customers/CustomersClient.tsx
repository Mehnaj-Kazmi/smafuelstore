"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, Panel, Stat, Table } from "@/components/admin/Ui";
import { money as fmt } from "@/lib/format";
import { allOrders, money, orderStats, type ApiOrder, type OrderStats } from "@/lib/orders-api";

type Row = {
  id: number;
  name: string;
  email: string;
  orders: number;
  spend: number;
  first: string;
  last: string;
};

export default function CustomersClient() {
  const [orders, setOrders] = useState<ApiOrder[] | null>(null);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [o, s] = await Promise.all([allOrders(), orderStats()]);
        setOrders(o);
        setStats(s);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load customers");
      }
    })();
  }, []);

  /* Built from orders rather than from the user table, so the figures are
     what people actually spent — a registered account with no orders is
     counted in the header but does not invent a row here. */
  const rows = useMemo<Row[]>(() => {
    const tally = new Map<number, Row>();
    for (const o of orders ?? []) {
      if (!o.user || o.status === "CANCELLED") continue;
      const row = tally.get(o.user.id) ?? {
        id: o.user.id,
        name: o.user.name,
        email: o.user.email,
        orders: 0,
        spend: 0,
        first: o.placedAt,
        last: o.placedAt,
      };
      row.orders += 1;
      row.spend += money(o.total);
      if (o.placedAt < row.first) row.first = o.placedAt;
      if (o.placedAt > row.last) row.last = o.placedAt;
      tally.set(o.user.id, row);
    }
    return [...tally.values()].sort((a, b) => b.spend - a.spend);
  }, [orders]);

  const maxSpend = Math.max(...rows.map((r) => r.spend), 1);
  const totalSpend = rows.reduce((n, r) => n + r.spend, 0);
  const repeat = rows.filter((r) => r.orders > 1).length;
  const registered = stats?.customers ?? 0;

  /* Same multi-field match as the catalogue search: a customer is looked up
     by whatever's on hand — name or email. */
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.name} ${r.email}`.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <div className="space-y-5">
      {error && <p role="alert" className="text-[13px] font-semibold text-sma-deal">{error}</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Registered customers" value={String(registered)} tone="good" />
        <Stat label="Have ordered" value={String(rows.length)} sub={`${registered - rows.length} yet to order`} />
        <Stat
          label="Repeat customers"
          value={rows.length ? `${Math.round((repeat / rows.length) * 100)}%` : "—"}
          sub="ordered more than once"
        />
        <Stat
          label="Average spend"
          value={rows.length ? fmt(totalSpend / rows.length) : fmt(0)}
          sub="per customer who ordered"
        />
      </div>

      <Panel
        title="Customers by spend"
        action={
          rows.length > 0 ? (
            <span className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="customer-search">Search customers</label>
              <input
                id="customer-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email…"
                className="w-[min(60vw,240px)] rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-[13px] text-white outline-none transition-colors placeholder:text-ink-faint focus:border-brand-green"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-[12px] font-bold text-ink-faint hover:text-white"
                >
                  Clear
                </button>
              )}
            </span>
          ) : undefined
        }
      >
        {!orders ? (
          <p className="text-[13px] text-ink-faint">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-[13px] text-ink-faint">
            No customer has ordered yet. Rows appear here once orders come in.
          </p>
        ) : shown.length === 0 ? (
          <p className="text-[13px] text-ink-faint">Nothing matches that search. {rows.length} customers total.</p>
        ) : (
          <>
          <p className="mb-3 text-[12px] text-ink-faint">Showing {shown.length} of {rows.length} customers</p>
          <Table head={["Customer", "First order", "Last order", "Orders", "Total spend", "Share"]}>
            {shown.map((r) => (
              <tr key={r.id}>
                <td className="py-2.5 pr-4">
                  <span className="block font-semibold text-white">{r.name}</span>
                  <span className="block text-[11px] text-ink-faint">{r.email}</span>
                </td>
                <td className="py-2.5 pr-4 text-xs text-ink-faint">{new Date(r.first).toLocaleDateString()}</td>
                <td className="py-2.5 pr-4 text-xs text-ink-faint">{new Date(r.last).toLocaleDateString()}</td>
                <td className="py-2.5 pr-4 tabular-nums">{r.orders}</td>
                <td className="py-2.5 pr-4 tabular-nums text-white">{fmt(r.spend)}</td>
                <td className="w-[28%] py-2.5"><Bar value={r.spend} max={maxSpend} /></td>
              </tr>
            ))}
          </Table>
          </>
        )}
      </Panel>
    </div>
  );
}
