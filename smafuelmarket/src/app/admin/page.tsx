import Link from "next/link";
import { Stat, Panel, Table, Pill, Bar, Columns } from "@/components/admin/Ui";
import { bestSellers, departmentBreakdown, inventoryStatus, recentOrders, revenueSeries, totals } from "@/lib/analytics";
import { money } from "@/lib/format";
import { orderStatusLabel, orderStatusTone, type OrderStatus } from "@/lib/orders";

export default function AdminDashboard() {
  const today = totals(1);
  const week = totals(7);
  const inv = inventoryStatus();
  const top = bestSellers(6);
  const depts = departmentBreakdown(7);
  const maxDept = Math.max(...depts.map((d) => d.revenue), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Today's revenue" value={money(today.revenue)} sub={`${today.orders} orders`} tone="good" />
        <Stat label="This week" value={money(week.revenue)} sub={`${week.orders} orders`} />
        <Stat label="Average order" value={money(today.averageOrder)} sub="today" />
        <Stat label="Customers today" value={String(today.customers)} sub={`${today.units} units sold`} />
        <Stat
          label="Needs attention"
          value={String(inv.out.length + inv.low.length)}
          sub={`${inv.out.length} out, ${inv.low.length} low`}
          tone={inv.out.length > 0 ? "bad" : inv.low.length > 0 ? "warn" : "good"}
        />
      </div>

      <Panel title="Revenue — last 14 days">
        <Columns data={revenueSeries(14)} />
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Live orders" action={<Link href="/admin/orders" className="text-[13px] text-sma-link hover:underline">All orders</Link>}>
          <Table head={["Order", "Customer", "Items", "Total", "Status"]}>
            {recentOrders.slice(0, 6).map((o) => (
              <tr key={o.id}>
                <td className="py-2 pr-4 font-mono text-xs">{o.id}</td>
                <td className="py-2 pr-4">{o.customer}</td>
                <td className="py-2 pr-4 tabular-nums">{o.items}</td>
                <td className="py-2 pr-4 tabular-nums">{money(o.total)}</td>
                <td className="py-2"><Pill tone={orderStatusTone[o.status as OrderStatus]}>{orderStatusLabel[o.status as OrderStatus]}</Pill></td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Best sellers today" action={<Link href="/admin/reports" className="text-[13px] text-sma-link hover:underline">Reports</Link>}>
          <Table head={["Product", "Units", "Revenue"]}>
            {top.map((row) => (
              <tr key={row.product.id}>
                <td className="py-2 pr-4">
                  <Link href={`/product/${row.product.id}`} className="line-clamp-1 hover:text-sma-link-hover">{row.product.title}</Link>
                  <span className="text-[11px] text-sma-muted">{row.product.sku}</span>
                </td>
                <td className="py-2 pr-4 tabular-nums">{row.units}</td>
                <td className="py-2 tabular-nums">{money(row.revenue)}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>

      <Panel title="Revenue by department — last 7 days">
        <Table head={["Department", "Products", "Revenue", "Share"]}>
          {depts.map((d) => (
            <tr key={d.department.slug}>
              <td className="py-2 pr-4">
                <Link href={`/department/${d.department.slug}`} className="hover:text-sma-link-hover">{d.department.name}</Link>
              </td>
              <td className="py-2 pr-4 tabular-nums">{d.items}</td>
              <td className="py-2 pr-4 tabular-nums">{money(d.revenue)}</td>
              <td className="w-[38%] py-2"><Bar value={d.revenue} max={maxDept} /></td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
