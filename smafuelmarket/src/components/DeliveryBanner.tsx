"use client";

import { useDelivery } from "@/lib/delivery";
import { formatDistance } from "@/lib/store-location";

/**
 * Sits directly under the header and explains the customer's delivery state.
 * Renders nothing once delivery is confirmed and un-simulated, so the common
 * case adds no chrome.
 */
export default function DeliveryBanner() {
  const { status, distance, store, ready, simulated, check, simulateInRange, reset } = useDelivery();

  if (!ready || status === "unknown") return null;

  if (status === "checking") {
    return (
      <Bar tone="neutral">
        <span className="animate-pulse">Checking whether we deliver to you…</span>
      </Bar>
    );
  }

  if (status === "in-range") {
    if (!simulated) return null;
    return (
      <Bar tone="ok">
        <strong>Simulated location active.</strong> You are being treated as {formatDistance(distance ?? 0)} from{" "}
        {store.name}.
        <button type="button" onClick={reset} className="ml-2 underline underline-offset-2">
          Use my real location
        </button>
      </Bar>
    );
  }

  if (status === "out-of-range") {
    return (
      <Bar tone="warn">
        <strong>Delivery isn&apos;t available at your location.</strong> You&apos;re{" "}
        {formatDistance(distance ?? 0)} from {store.name}, outside our {store.radiusMiles}-mile delivery
        area. You can browse everything — ordering is disabled until you&apos;re closer.
        <Actions onRetry={check} onSimulate={simulateInRange} />
      </Bar>
    );
  }

  const message =
    status === "denied"
      ? "Location access was blocked, so we can't confirm you're inside our delivery area."
      : status === "unsupported"
        ? "This browser doesn't support location lookup, so we can't confirm your delivery area."
        : "We couldn't read your location just now.";

  return (
    <Bar tone="warn">
      <strong>Ordering is disabled.</strong> {message} Browsing works as normal.
      <Actions onRetry={check} onSimulate={simulateInRange} retryLabel="Try again" />
    </Bar>
  );
}

function Actions({
  onRetry,
  onSimulate,
  retryLabel = "Check again",
}: {
  onRetry: () => void;
  onSimulate: () => void;
  retryLabel?: string;
}) {
  return (
    <span className="ml-2 inline-flex flex-wrap gap-3">
      <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2">
        {retryLabel}
      </button>
      <button type="button" onClick={onSimulate} className="underline underline-offset-2 opacity-80">
        Simulate an in-range address
      </button>
    </span>
  );
}

function Bar({ tone, children }: { tone: "ok" | "warn" | "neutral"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "bg-[#e7f5ec] text-[#0d5c33] border-[#a9d8bd]"
      : tone === "warn"
        ? "bg-[#fdf3e3] text-[#7a4a05] border-[#f0d4a3]"
        : "bg-[#eef2f5] text-sma-muted border-sma-border";

  return (
    <div className={`border-b ${cls}`} role="status">
      <div className="mx-auto max-w-[1500px] px-4 py-2 text-[13px] leading-5">{children}</div>
    </div>
  );
}
