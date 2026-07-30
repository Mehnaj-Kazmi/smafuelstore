"use client";

import { useDelivery } from "@/lib/delivery";

/**
 * Shown on open when we have no verified delivery result yet.
 *
 * This is a "pre-permission" dialog: it explains why the store wants a location
 * and only then raises the browser's own prompt, from a real click. That order
 * matters — a browser will surface its dialog once and, if refused, may never
 * offer it again, so spending it on page load with no explanation tends to burn
 * the permission permanently.
 *
 * Declining is remembered for the session only, so the next visit asks again.
 */
export default function LocationPrompt() {
  const { status, store, check, simulateInRange, promptOpen, dismissLocationPrompt } = useDelivery();

  /* Whether to show, and who is exempt, is decided in the delivery context so a
     blocked add-to-cart can reopen this from anywhere. */
  if (!promptOpen) return null;

  const dismiss = dismissLocationPrompt;

  const blocked = status === "denied";

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="loc-title">
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className="anim-fade absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      <div className="anim-pop card relative w-full max-w-[420px] overflow-hidden p-7 text-center shadow-2xl">
        <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-brand-green opacity-20 blur-3xl" />

        <span className="relative mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-brand-green/15 text-brand-green">
          <span className="pulse-ring grid h-16 w-16 place-items-center rounded-full">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden="true">
              <path d="M12 2a7 7 0 0 0-7 7c0 5.2 6.2 12.3 6.5 12.6a.7.7 0 0 0 1 0C12.8 21.3 19 14.2 19 9a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5Z" />
            </svg>
          </span>
        </span>

        <h2 id="loc-title" className="relative text-[26px] font-extrabold leading-tight text-white">
          {blocked ? "Location is blocked" : "Where are we delivering?"}
        </h2>

        <p className="relative mt-3 text-sm leading-6 text-ink-soft">
          {blocked ? (
            <>
              Your browser is blocking location for this site. Allow it from the address-bar icon, or use the
              demo address below, to start adding items.
            </>
          ) : (
            <>
              We deliver within {store.radiusMiles} miles of {store.city}, so we need to know where you are
              before you add anything. Browsing is open to everyone.
            </>
          )}
        </p>

        <div className="relative mt-7 space-y-2.5">
          {!blocked && (
            <button type="button" onClick={check} className="btn-pill btn-cart w-full py-3">
              Use my location
            </button>
          )}
          <button type="button" onClick={dismiss} className="btn-pill btn-buy w-full py-3">
            {blocked ? "Continue shopping" : "Not now — just browsing"}
          </button>
          <button
            type="button"
            onClick={() => {
              simulateInRange();
              dismiss();
            }}
            className="link-draw mx-auto block pt-1 text-xs font-bold text-ink-faint hover:text-white"
          >
            Use a demo address near the store
          </button>
        </div>
      </div>
    </div>
  );
}
