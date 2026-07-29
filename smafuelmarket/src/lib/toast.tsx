"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Toast = {
  id: number;
  message: string;
  /** Optional second line, e.g. the quantity that was added. */
  detail?: string;
  /** Shown as a button; dismisses the toast when pressed. */
  action?: { label: string; run: () => void };
  tone?: "default" | "good" | "bad";
};

type ToastInput = Omit<Toast, "id">;

type Value = {
  toasts: Toast[];
  /** Shows a toast and returns its id. */
  notify: (toast: ToastInput) => number;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<Value | null>(null);

/** How long a toast stays before dismissing itself. */
export const TOAST_MS = 6000;

/**
 * Lightweight notifications for actions that would otherwise happen silently.
 *
 * Adding something to a basket gives no feedback beyond a number changing in
 * the corner, which is easy to miss and impossible to reverse without hunting
 * for the cart. A toast reports what happened and carries the undo with it, so
 * a mistaken tap costs one click to reverse at the moment it is noticed.
 *
 * Six seconds is deliberate: long enough to read the line and reach for Undo,
 * short enough not to pile up. Hovering pauses the timer (see Toaster), because
 * the toast disappearing as the pointer arrives is worse than no toast at all.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((toast: ToastInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    /* Capped at three: a stack taller than that covers the page it is
       reporting on, and the oldest is the least likely to still be wanted. */
    setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
    return id;
  }, []);

  const value = useMemo(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): Value {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside a ToastProvider");
  return ctx;
}
