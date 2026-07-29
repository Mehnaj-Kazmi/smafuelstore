"use client";

import { useEffect, useRef, useState } from "react";
import { TOAST_MS, useToast, type Toast } from "@/lib/toast";

/**
 * The toast stack, bottom-left of the viewport.
 *
 * Placed opposite the cart button in the header so the notification and the
 * thing it refers to are not fighting for the same corner, and low enough that
 * it never covers the primary action on a page.
 */
export default function Toaster() {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-4 z-[70] flex w-[min(92vw,380px)] flex-col gap-2"
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(TOAST_MS);
  const startedAt = useRef(Date.now());

  /*
   * The timer is paused on hover and focus rather than simply cleared, so the
   * remaining time carries over — a toast the customer is reading, or has
   * tabbed into to reach Undo, must not expire under them.
   */
  useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    const id = setTimeout(onDismiss, remaining.current);
    return () => {
      clearTimeout(id);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
    };
  }, [paused, onDismiss]);

  const accent =
    toast.tone === "good" ? "border-brand-green/50" : toast.tone === "bad" ? "border-sma-deal/50" : "border-line";

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={`anim-rise pointer-events-auto flex items-start gap-3 rounded-xl border ${accent} bg-surface-2 p-3.5 shadow-2xl backdrop-blur`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold leading-5 text-white">{toast.message}</span>
        {toast.detail && <span className="mt-0.5 block text-[12px] text-ink-faint">{toast.detail}</span>}
      </span>

      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.run();
            onDismiss();
          }}
          className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wide text-brand-green transition hover:border-brand-green hover:bg-brand-green/10"
        >
          {toast.action.label}
        </button>
      )}

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-full p-1 text-ink-faint transition hover:bg-white/10 hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
