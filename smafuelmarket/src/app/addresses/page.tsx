import type { Metadata } from "next";
import Link from "next/link";
import { primaryStore } from "@/lib/store-location";

export const metadata: Metadata = { title: "Your addresses" };

const saved = [
  { label: "Home", line1: "88 Maple Court", city: primaryStore.city, postcode: "92501", isDefault: true, inRange: true },
  { label: "Work", line1: "12 Industrial Way, Unit 4", city: primaryStore.city, postcode: "92507", isDefault: false, inRange: true },
  { label: "Mum's house", line1: "301 Hillcrest Road", city: "Moreno Valley", postcode: "92553", isDefault: false, inRange: false },
];

export default function AddressesPage() {
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6">
      <div className="bg-surface p-5">
        <h1 className="text-2xl font-bold">Your addresses</h1>
        <p className="mt-1 text-sm text-sma-muted">
          Only addresses inside the {primaryStore.radiusMiles}-mile delivery area can be used at checkout.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {saved.map((a) => (
          <article key={a.label} className={`flex flex-col rounded-lg border bg-surface p-5 ${a.isDefault ? "border-sma-accent" : "border-sma-border"}`}>
            {a.isDefault && <span className="mb-2 self-start rounded bg-sma-navy-light px-2 py-0.5 text-[11px] font-bold text-white">Default</span>}
            <h2 className="text-base font-bold">{a.label}</h2>
            <p className="mt-1 text-[13px] leading-5 text-sma-muted">{a.line1}<br />{a.city} {a.postcode}</p>
            <p className={`mt-2 text-xs font-medium ${a.inRange ? "text-[#007600]" : "text-[#7a4a05]"}`}>
              {a.inRange ? "Inside delivery area" : "Outside delivery area — collection only"}
            </p>
            <div className="mt-auto flex gap-3 pt-4 text-[13px]">
              <button type="button" className="text-sma-link hover:text-sma-link-hover hover:underline">Edit</button>
              <button type="button" className="text-sma-link hover:text-sma-link-hover hover:underline">Remove</button>
            </div>
          </article>
        ))}

        <Link href="/addresses" className="flex min-h-[180px] items-center justify-center rounded-lg border-2 border-dashed border-sma-border bg-surface p-5 text-center text-sm font-medium text-sma-muted hover:border-sma-accent hover:text-sma-link-hover">
          + Add a new address
        </Link>
      </div>
    </div>
  );
}
