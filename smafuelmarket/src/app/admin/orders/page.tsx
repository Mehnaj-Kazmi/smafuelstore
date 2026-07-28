import type { Metadata } from "next";
import { Panel, Pill, Stat, Table } from "@/components/admin/Ui";
import { recentOrders, totals } from "@/lib/analytics";
import { orderFlow, orderStatusLabel, orderStatusTone, type OrderStatus } from "@/lib/orders";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  const today = totals(1);
  const counts = orderFlow.map((s) => ({
    status: s,
    count: recentOrders.filter((o) => o.status === s).length,
  }));
  const active = recentOrders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Orders today" value={String(today.orders)} tone="good" />
        <Stat label="In progress" value={String(active.length)} tone="warn" sub="not yet delivered" />
        <Stat label="Revenue today" value={money(today.revenue)} />
        <Stat label="Average order" value={money(today.averageOrder)} />
      </div>

      <Panel title="Pipeline">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {counts.map((c) => (
            <div key={c.status} className="rounded-lg border border-sma-border p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{c.count}</p>
              <p className="mt-0.5 text-[11px] text-sma-muted">{orderStatusLabel[c.status]}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="All orders">
        <Table head={["Order", "Customer", "Placed", "Items", "Total", "Status", ""]}>
          {recentOrders.map((o) => (
            <tr key={o.id}>
              <td className="py-2 pr-4 font-mono text-xs">{o.id}</td>
              <td className="py-2 pr-4">{o.customer}</td>
              <td className="py-2 pr-4 text-sma-muted">{o.placed}</td>
              <td className="py-2 pr-4 tabular-nums">{o.items}</td>
              <td className="py-2 pr-4 tabular-nums">{money(o.total)}</td>
              <td className="py-2 pr-4"><Pill tone={orderStatusTone[o.status as OrderStatus]}>{orderStatusLabel[o.status as OrderStatus]}</Pill></td>
              <td className="py-2">
                <span className="flex gap-2 text-[13px]">
                  <button type="button" className="text-sma-link hover:underline">View</button>
                  <button type="button" className="text-sma-link hover:underline">Advance</button>
                </span>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
