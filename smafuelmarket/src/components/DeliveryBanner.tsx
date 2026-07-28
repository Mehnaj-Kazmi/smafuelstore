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
      ? "Location access was blocked, so we can't show your delivery time yet."
      : status === "unsupported"
        ? "This browser doesn't support location lookup, so we can't show your delivery time yet."
        : "We couldn't read your location just now.";

  /* Shopping is unaffected here — only a verified out-of-range result blocks
     ordering — so this reads as an offer to improve the experience rather
     than a warning that something is broken. */
  return (
    <Bar tone="neutral">
      {message} You can shop as normal; we&apos;ll confirm delivery from the address at checkout.
      <Actions onRetry={check} onSimulate={simulateInRange} retryLabel="Share location" />
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
  /* Tinted washes over the black canvas, rather than light pastel bars. */
  const cls =
    tone === "ok"
      ? "bg-brand-green/12 text-[#7ef0ac] border-brand-green/35"
      : tone === "warn"
        ? "bg-brand-orange/12 text-[#ffc38c] border-brand-orange/35"
        : "bg-surface text-ink-soft border-line";

  return (
    <div className={`border-b ${cls}`} role="status">
      <div className="mx-auto max-w-[1500px] px-4 py-2 text-[13px] leading-5">{children}</div>
    </div>
  );
}
