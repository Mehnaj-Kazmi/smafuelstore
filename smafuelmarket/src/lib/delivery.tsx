"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { nearestStore, type StoreLocation } from "./store-location";
import { usePrimaryStore, useStores } from "./store-context";

/**
 * Delivery eligibility.
 *
 * Browsing is always allowed. Ordering is blocked only when we have positively
 * verified that the customer is outside every store's delivery radius.
 *
 * An earlier version refused to sell whenever location could not be confirmed,
 * which meant a declined browser prompt disabled the entire catalogue — the
 * common case, since most visitors decline. Not knowing where someone is is
 * not evidence that they are too far away, so the unknown states now allow
 * ordering and the address entered at checkout is what the delivery decision
 * actually rests on.
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
  const stores = useStores();
  const primaryStore = usePrimaryStore();
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
      return;
    }

    setStatus("checking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const result = nearestStore({ lat: pos.coords.latitude, lng: pos.coords.longitude }, stores);
        const next: DeliveryStatus = result.inRange ? "in-range" : "out-of-range";
        setStore(result.store);
        setDistance(result.distance);
        setSimulated(false);
        setStatus(next);
        persist({ status: next, distance: result.distance, storeId: result.store.id });
      },
      (err) => {
        /* Deliberately not persisted. Only a verified result is worth
           remembering — caching a refusal would mean the store never asks
           again on later visits, even after the visitor changes their mind. */
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, [persist, stores]);

  const simulateInRange = useCallback(() => {
    setStore(primaryStore);
    setDistance(0.4);
    setSimulated(true);
    setStatus("in-range");
    persist({ status: "in-range", distance: 0.4, storeId: primaryStore.id, simulated: true });
  }, [persist, primaryStore]);

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

  /*
   * Restore a previously verified answer. If there isn't one the status stays
   * "unknown", which is what LocationPrompt watches for — the browser dialog is
   * raised from that prompt's button rather than automatically on load, so the
   * visitor is told why we're asking before the permission is spent.
   */
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
  }, []);

  const value = useMemo<DeliveryValue>(
    () => ({
      status,
      distance,
      /* Falls back to the primary store until a position is verified, so the
         name shown is always a real configured store. */
      store: store ?? primaryStore,
      canOrder: status !== "out-of-range",
      ready,
      simulated,
      check,
      simulateInRange,
      reset,
    }),
    [status, distance, store, primaryStore, ready, simulated, check, simulateInRange, reset],
  );

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function useDelivery(): DeliveryValue {
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error("useDelivery must be used inside a DeliveryProvider");
  return ctx;
}
