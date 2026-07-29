"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Panel, Pill, Stat, Table } from "@/components/admin/Ui";
import { money as fmt } from "@/lib/format";
import { allOrders, money, setOrderStatus, ORDER_STATUSES, type ApiOrder } from "@/lib/orders-api";

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

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<ApiOrder[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const load = useCallback(async () => {
    try {
      setOrders(await allOrders());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load orders");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(id: string, status: string) {
    setBusyId(id);
    setError("");
    try {
      await setOrderStatus(id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the order");
    } finally {
      setBusyId(null);
    }
  }

  const stats = useMemo(() => {
    const list = orders ?? [];
    const live = list.filter((o) => o.status !== "CANCELLED");
    const revenue = live.reduce((n, o) => n + money(o.total), 0);
    const today = new Date().toDateString();
    return {
      total: list.length,
      awaiting: list.filter((o) => o.status === "PENDING").length,
      inFlight: list.filter((o) => ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"].includes(o.status)).length,
      todayRevenue: live
        .filter((o) => new Date(o.placedAt).toDateString() === today)
        .reduce((n, o) => n + money(o.total), 0),
      revenue,
    };
  }, [orders]);

  const shown = useMemo(
    () => (orders ?? []).filter((o) => filter === "ALL" || o.status === filter),
    [orders, filter],
  );

  if (error && !orders) {
    return (
      <Panel title="Orders">
        <p className="text-[13px] font-semibold text-sma-deal">{error}</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Revenue today" value={fmt(stats.todayRevenue)} tone="good" sub="excludes cancelled" />
        <Stat label="Awaiting action" value={String(stats.awaiting)} tone="warn" sub="pending orders" />
        <Stat label="In progress" value={String(stats.inFlight)} sub="confirmed → out for delivery" />
        <Stat label="Orders all time" value={String(stats.total)} sub={`${fmt(stats.revenue)} total`} />
      </div>

      {error && <p role="alert" className="text-[13px] font-semibold text-sma-deal">{error}</p>}

      <Panel
        title="Orders"
        action={
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-[13px] text-white outline-none focus:border-brand-green"
          >
            <option value="ALL">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabel[s]}</option>
            ))}
          </select>
        }
      >
        {!orders ? (
          <p className="text-[13px] text-ink-faint">Loading orders…</p>
        ) : shown.length === 0 ? (
          <p className="text-[13px] text-ink-faint">
            {orders.length === 0
              ? "No orders have been placed yet. They appear here the moment a customer checks out."
              : "No orders with that status."}
          </p>
        ) : (
          <Table head={["Order", "Placed", "Customer", "Items", "Total", "Status", "Move to"]}>
            {shown.map((o) => (
              <tr key={o.id} className={o.status === "CANCELLED" ? "opacity-60" : ""}>
                <td className="py-2.5 pr-4 font-mono text-xs text-white">{o.id.slice(-8).toUpperCase()}</td>
                <td className="py-2.5 pr-4 text-xs text-ink-faint">
                  {new Date(o.placedAt).toLocaleDateString()}{" "}
                  {new Date(o.placedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="py-2.5 pr-4">
                  <span className="block text-[13px] font-semibold text-white">{o.user?.name ?? "—"}</span>
                  <span className="block text-[11px] text-ink-faint">
                    {o.address ? `${o.address.line1}, ${o.address.city} ${o.address.zip}` : o.user?.email}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-xs text-ink-soft">
                  {o.items.reduce((n, i) => n + i.quantity, 0)} units
                  <span className="block text-[11px] text-ink-faint">
                    {o.items.slice(0, 2).map((i) => i.product.title).join(", ")}
                    {o.items.length > 2 ? ` +${o.items.length - 2}` : ""}
                  </span>
                </td>
                <td className="py-2.5 pr-4 font-semibold tabular-nums text-white">{fmt(money(o.total))}</td>
                <td className="py-2.5 pr-4">
                  <Pill tone={statusTone[o.status] ?? "muted"}>{statusLabel[o.status] ?? o.status}</Pill>
                </td>
                <td className="py-2.5">
                  <select
                    value=""
                    disabled={busyId === o.id}
                    onChange={(e) => e.target.value && changeStatus(o.id, e.target.value)}
                    className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-[12px] text-white outline-none focus:border-brand-green disabled:opacity-50"
                  >
                    <option value="">{busyId === o.id ? "Saving…" : "Change…"}</option>
                    {ORDER_STATUSES.filter((s) => s !== o.status).map((s) => (
                      <option key={s} value={s}>{statusLabel[s]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}
