"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { nearestStore, primaryStore, type StoreLocation } from "./store-location";

/**
 * Delivery eligibility.
 *
 * Browsing is always allowed. Ordering requires a confirmed position inside a
 * store's delivery radius, so anything that leaves us unable to verify the
 * customer's location — denial, an unsupported browser, a lookup error — falls
 * back to "cannot order" rather than quietly permitting checkout.
 */

export type DeliveryStatus =
  | "unknown"      // not asked yet
  | "checking"     // waiting on the browser
  | "in-range"     // verified inside the radius
  | "out-of-range" // verified, but too far
  | "denied"       // permission refused
  | "unsupported"  // no geolocation API
  | "error";       // lookup failed

type Persisted = { status: DeliveryStatus; distance?: number; storeId?: string; simulated?: boolean };

type DeliveryValue = {
  status: DeliveryStatus;
  distance: number | null;
  store: StoreLocation;
  /** True only when a position has been verified inside the radius. */
  canOrder: boolean;
  /** False until the stored result has been read, so SSR and first paint agree. */
  ready: boolean;
  simulated: boolean;
  check: () => void;
  /** Demonstration aid: treats the customer as standing at the store. */
  simulateInRange: () => void;
  reset: () => void;
};

const STORAGE_KEY = "sma-store:delivery:v1";

const DeliveryContext = createContext<DeliveryValue | null>(null);

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<DeliveryStatus>("unknown");
  const [distance, setDistance] = useState<number | null>(null);
  const [store, setStore] = useState<StoreLocation>(primaryStore);
  const [simulated, setSimulated] = useState(false);
  const [ready, setReady] = useState(false);

  const persist = useCallback((next: Persisted) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage may be unavailable; the result still holds for this session.
    }
  }, []);

  const check = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      persist({ status: "unsupported" });
      return;
    }

    setStatus("checking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const result = nearestStore({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        const next: DeliveryStatus = result.inRange ? "in-range" : "out-of-range";
        setStore(result.store);
        setDistance(result.distance);
        setSimulated(false);
        setStatus(next);
        persist({ status: next, distance: result.distance, storeId: result.store.id });
      },
      (err) => {
        const next: DeliveryStatus = err.code === err.PERMISSION_DENIED ? "denied" : "error";
        setStatus(next);
        persist({ status: next });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, [persist]);

  const simulateInRange = useCallback(() => {
    setStore(primaryStore);
    setDistance(0.4);
    setSimulated(true);
    setStatus("in-range");
    persist({ status: "in-range", distance: 0.4, storeId: primaryStore.id, simulated: true });
  }, [persist]);

  const reset = useCallback(() => {
    setStatus("unknown");
    setDistance(null);
    setSimulated(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to clean up */
    }
  }, []);

  // Restore a previous answer, or ask on the first visit.
  useEffect(() => {
    let saved: Persisted | null = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      saved = raw ? (JSON.parse(raw) as Persisted) : null;
    } catch {
      saved = null;
    }

    if (saved?.status && saved.status !== "unknown" && saved.status !== "checking") {
      setStatus(saved.status);
      setDistance(saved.distance ?? null);
      setSimulated(Boolean(saved.simulated));
      setReady(true);
      return;
    }

    setReady(true);
    check();
  }, [check]);

  const value = useMemo<DeliveryValue>(
    () => ({
      status,
      distance,
      store,
      canOrder: status === "in-range",
      ready,
      simulated,
      check,
      simulateInRange,
      reset,
    }),
    [status, distance, store, ready, simulated, check, simulateInRange, reset],
  );

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function useDelivery(): DeliveryValue {
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error("useDelivery must be used inside a DeliveryProvider");
  return ctx;
}
