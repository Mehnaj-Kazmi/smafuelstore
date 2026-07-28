import type { Metadata } from "next";
import { Bar, Columns, Panel, Stat, Table } from "@/components/admin/Ui";
import { bestSellers, departmentBreakdown, revenueSeries, totals } from "@/lib/analytics";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };

export default function AdminReportsPage() {
  const day = totals(1);
  const week = totals(7);
  const month = totals(30);
  const top = bestSellers(10, 30);
  const depts = departmentBreakdown(30);
  const maxDept = Math.max(...depts.map((d) => d.revenue), 1);
  const maxUnits = Math.max(...top.map((t) => t.units), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Daily sales" value={money(day.revenue)} sub={`${day.orders} orders`} tone="good" />
        <Stat label="Weekly sales" value={money(week.revenue)} sub={`${week.orders} orders`} />
        <Stat label="Monthly sales" value={money(month.revenue)} sub={`${month.orders} orders`} />
        <Stat label="Average order" value={money(month.averageOrder)} sub="30-day average" />
      </div>

      <Panel title="Revenue — last 30 days">
        <Columns data={revenueSeries(30)} />
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Product performance — 30 days">
          <Table head={["Product", "Units", "Revenue", ""]}>
            {top.map((row) => (
              <tr key={row.product.id}>
                <td className="py-2 pr-4">
                  <span className="line-clamp-1">{row.product.title}</span>
                  <span className="text-[11px] text-sma-muted">{row.product.sku}</span>
                </td>
                <td className="py-2 pr-4 tabular-nums">{row.units}</td>
                <td className="py-2 pr-4 tabular-nums">{money(row.revenue)}</td>
                <td className="w-[26%] py-2"><Bar value={row.units} max={maxUnits} /></td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Department performance — 30 days">
          <Table head={["Department", "Revenue", "Share"]}>
            {depts.map((d) => (
              <tr key={d.department.slug}>
                <td className="py-2 pr-4">{d.department.name}</td>
                <td className="py-2 pr-4 tabular-nums">{money(d.revenue)}</td>
                <td className="w-[46%] py-2"><Bar value={d.revenue} max={maxDept} /></td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
    </div>
  );
}
