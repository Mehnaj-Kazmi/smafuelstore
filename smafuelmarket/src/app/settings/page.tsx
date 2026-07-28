"use client";

import { useDelivery } from "@/lib/delivery";
import { formatDistance } from "@/lib/store-location";

export default function SettingsPage() {
  const { status, distance, store, canOrder, simulated, check, reset } = useDelivery();

  const statusText: Record<string, string> = {
    unknown: "Not checked yet",
    checking: "Checking…",
    "in-range": `Inside the delivery area${distance != null ? ` — ${formatDistance(distance)} away` : ""}`,
    "out-of-range": `Outside the delivery area${distance != null ? ` — ${formatDistance(distance)} away` : ""}`,
    denied: "Location access blocked",
    unsupported: "Not supported by this browser",
    error: "Lookup failed",
  };

  return (
    <div className="mx-auto max-w-[800px] px-4 py-6">
      <div className="bg-surface p-5">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <section className="mt-5 bg-surface p-6">
        <h2 className="text-lg font-bold">Delivery location</h2>
        <p className="mt-1 text-[13px] leading-5 text-sma-muted">
          We compare your position against {store.name} to decide whether we can deliver. The comparison happens on
          your device — your coordinates are not sent anywhere.
        </p>

        <dl className="mt-4 space-y-2 text-[13px]">
          <div className="flex gap-3"><dt className="w-32 shrink-0 text-sma-muted">Status</dt><dd className="font-medium">{statusText[status]}</dd></div>
          <div className="flex gap-3"><dt className="w-32 shrink-0 text-sma-muted">Ordering</dt>
            <dd className={canOrder ? "font-medium text-[#007600]" : "font-medium text-[#7a4a05]"}>
              {canOrder ? "Enabled" : "Disabled"}
            </dd>
          </div>
          <div className="flex gap-3"><dt className="w-32 shrink-0 text-sma-muted">Nearest store</dt><dd>{store.name}</dd></div>
          <div className="flex gap-3"><dt className="w-32 shrink-0 text-sma-muted">Radius</dt><dd>{store.radiusMiles} miles</dd></div>
          {simulated && <div className="flex gap-3"><dt className="w-32 shrink-0 text-sma-muted">Mode</dt><dd className="font-medium">Simulated location</dd></div>}
        </dl>

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={check} className="btn-pill btn-cart font-medium">Re-check my location</button>
          <button type="button" onClick={reset} className="btn-pill bg-surface font-medium hover:bg-gray-50">Clear saved result</button>
        </div>
      </section>

      <section className="mt-5 bg-surface p-6">
        <h2 className="text-lg font-bold">Notifications</h2>
        <div className="mt-3 space-y-2">
          {["Order status updates", "Daily deals and flash sales", "Back-in-stock alerts for saved items", "Receipts by email"].map((label, i) => (
            <label key={label} className="flex cursor-pointer items-center gap-3 text-[13px]">
              <input type="checkbox" defaultChecked={i < 2} className="h-4 w-4 accent-sma-navy-light" />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="mt-5 bg-surface p-6">
        <h2 className="text-lg font-bold">Account</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className="btn-pill bg-surface font-medium hover:bg-gray-50">Change password</button>
          <button type="button" className="btn-pill bg-surface font-medium hover:bg-gray-50">Update contact details</button>
        </div>
        <p className="mt-3 text-xs text-sma-muted">Demonstration storefront — these controls are illustrative.</p>
      </section>
    </div>
  );
}
