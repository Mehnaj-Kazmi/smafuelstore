import Link from "next/link";
import { primaryStore } from "@/lib/store-location";

/** Today's pump prices — the one card that is about fuel rather than the shop. */
export default function FuelPrices() {
  return (
    <section className="flex flex-col bg-white p-5">
      <h2 className="mb-1 text-[21px] font-bold leading-6">Today at the pump</h2>
      <p className="mb-3 text-xs text-sma-muted">{primaryStore.name} · {primaryStore.hours}</p>

      <ul className="flex-1 divide-y divide-sma-border">
        {primaryStore.fuelPrices.map((f) => (
          <li key={f.grade} className="flex items-baseline justify-between py-2.5">
            <span className="text-sm font-medium">{f.grade}</span>
            <span className="font-mono text-lg tabular-nums">
              ${f.price.toFixed(2)}
              <span className="ml-1 text-[11px] text-sma-muted">/gal</span>
            </span>
          </li>
        ))}
      </ul>

      <Link href="/contact" className="mt-4 text-[13px] text-sma-link hover:text-sma-link-hover hover:underline">
        Store details &amp; directions
      </Link>
    </section>
  );
}
