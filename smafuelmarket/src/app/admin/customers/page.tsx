import type { Metadata } from "next";
import { Bar, Panel, Stat, Table } from "@/components/admin/Ui";
import { topCustomers, totals } from "@/lib/analytics";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Customers" };

export default function AdminCustomersPage() {
  const week = totals(7);
  const maxSpend = Math.max(...topCustomers.map((c) => c.spend), 1);
  const totalSpend = topCustomers.reduce((s, c) => s + c.spend, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Customers this week" value={String(week.customers)} tone="good" />
        <Stat label="Repeat rate" value="62%" sub="ordered more than once" />
        <Stat label="Lifetime value" value={money(totalSpend / topCustomers.length)} sub="average, top customers" />
        <Stat label="Orders per customer" value="3.4" sub="rolling 90 days" />
      </div>

      <Panel title="Top customers">
        <Table head={["Customer", "Customer since", "Orders", "Total spend", "Share"]}>
          {topCustomers.map((c) => (
            <tr key={c.name}>
              <td className="py-2 pr-4 font-medium">{c.name}</td>
              <td className="py-2 pr-4 text-sma-muted">{c.since}</td>
              <td className="py-2 pr-4 tabular-nums">{c.orders}</td>
              <td className="py-2 pr-4 tabular-nums">{money(c.spend)}</td>
              <td className="w-[32%] py-2"><Bar value={c.spend} max={maxSpend} /></td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
