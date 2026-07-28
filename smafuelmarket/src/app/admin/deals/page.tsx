import Link from "next/link";
import type { Metadata } from "next";
import { Panel, Pill, Stat, Table } from "@/components/admin/Ui";
import { coupons, dealKindLabel, deals } from "@/lib/deals";
import { getProduct } from "@/lib/catalog";

export const metadata: Metadata = { title: "Daily deals" };

export default function AdminDealsPage() {
  const flash = deals.filter((d) => d.kind === "flash");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active deals" value={String(deals.length)} tone="good" />
        <Stat label="Flash sales" value={String(flash.length)} tone="warn" sub="time limited" />
        <Stat label="Coupon codes" value={String(coupons.length)} />
        <Stat label="Products on offer" value={String(new Set(deals.flatMap((d) => d.productIds)).size)} />
      </div>

      <Panel
        title="Promotions"
        action={<button type="button" className="btn-pill btn-cart text-[13px] font-medium">+ New deal</button>}
      >
        <Table head={["Deal", "Type", "Products", "Discount", "Ends", ""]}>
          {deals.map((d) => (
            <tr key={d.id}>
              <td className="py-2 pr-4">
                <span className="block font-medium">{d.title}</span>
                <span className="text-[11px] text-sma-muted">{d.detail}</span>
              </td>
              <td className="py-2 pr-4"><Pill tone={d.kind === "flash" ? "bad" : d.kind === "bogo" ? "good" : "info"}>{dealKindLabel[d.kind]}</Pill></td>
              <td className="py-2 pr-4">
                <span className="flex flex-col gap-0.5">
                  {d.productIds.map((id) => {
                    const p = getProduct(id);
                    return p ? (
                      <Link key={id} href={`/product/${id}`} className="line-clamp-1 text-xs text-sma-link hover:underline">
                        {p.title}
                      </Link>
                    ) : null;
                  })}
                </span>
              </td>
              <td className="py-2 pr-4 tabular-nums">{d.percentOff ? `${d.percentOff}%` : "—"}</td>
              <td className="py-2 pr-4 text-sma-muted">{d.endsInHours != null ? `${d.endsInHours}h` : "Ongoing"}</td>
              <td className="py-2">
                <span className="flex gap-2 text-[13px]">
                  <button type="button" className="text-sma-link hover:underline">Edit</button>
                  <button type="button" className="text-sma-link hover:underline">End</button>
                </span>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>

      <Panel
        title="Coupon codes"
        action={<button type="button" className="btn-pill btn-cart text-[13px] font-medium">+ New coupon</button>}
      >
        <Table head={["Code", "Description", "Value", "Minimum spend"]}>
          {coupons.map((c) => (
            <tr key={c.code}>
              <td className="py-2 pr-4 font-mono font-bold">{c.code}</td>
              <td className="py-2 pr-4">{c.description}</td>
              <td className="py-2 pr-4 tabular-nums">{c.percentOff ? `${c.percentOff}%` : `$${c.amountOff?.toFixed(2)}`}</td>
              <td className="py-2 tabular-nums">{c.minSpend ? `$${c.minSpend.toFixed(2)}` : "None"}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
