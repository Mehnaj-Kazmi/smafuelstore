"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { nearestStore, type StoreLocation } from "./store-location";
import { usePrimaryStore, useStores } from "./store-context";
import { useAuth } from "./auth";

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

type Persisted = { status: DeliveryStatus; distance?: number; storeId?: number; simulated?: boolean };

type DeliveryValue = {
  status: DeliveryStatus;
  distance: number | null;
  store: StoreLocation;
  /** True when this session may place an order. */
  canOrder: boolean;
  /**
   * True when ordering is blocked only because we do not know where they are
   * yet — as opposed to knowing, and knowing they are too far. Callers use it to
   * offer the location dialog instead of a dead "unavailable" button.
   */
  needsLocation: boolean;
  /** True when a position was verified and fell outside every store's radius. */
  outOfRange: boolean;
  /** False until the stored result has been read, so SSR and first paint agree. */
  ready: boolean;
  simulated: boolean;
  check: () => void;
  /** Demonstration aid: treats the customer as standing at the store. */
  simulateInRange: () => void;
  reset: () => void;
  /** Whether the location dialog is currently showing. */
  promptOpen: boolean;
  /** Raises the dialog — used when a blocked action needs an address first. */
  openLocationPrompt: () => void;
  dismissLocationPrompt: () => void;
};

/*
 * Where someone is, is theirs.
 *
 * A verified result used to be stored under one key for the whole browser, so
 * signing in as someone else inherited the previous person's store and delivery
 * status — and, because the prompt only opens while the status is unknown, a new
 * account was never asked where to deliver. Keying on the user id gives each
 * account its own answer and asks a new one properly, the same rule the basket
 * already follows in cart.tsx.
 */
const STORAGE_PREFIX = "sma-store:delivery:v2";
const DISMISS_PREFIX = "sma-store:location-prompt-dismissed";
const GUEST = "guest";

export function deliveryStorageKey(userId: number | null) {
  return `${STORAGE_PREFIX}:${userId ?? GUEST}`;
}

/** Declining is remembered for the session only, so the next visit asks again. */
function dismissKey(userId: number | null) {
  return `${DISMISS_PREFIX}:${userId ?? GUEST}`;
}

const DeliveryContext = createContext<DeliveryValue | null>(null);

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<DeliveryStatus>("unknown");
  const [distance, setDistance] = useState<number | null>(null);
  const stores = useStores();
  const primaryStore = usePrimaryStore();
  const { user, hydrated: authReady } = useAuth();
  const userId = user?.id ?? null;
  /* Staff are running the shop, not ordering from it, so they are never asked
     where to deliver and never blocked for not answering. */
  const isAdmin = user?.role === "ADMIN";
  const [store, setStore] = useState<StoreLocation>(primaryStore);
  const [simulated, setSimulated] = useState(false);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  const persist = useCallback(
    (next: Persisted) => {
      try {
        window.localStorage.setItem(deliveryStorageKey(userId), JSON.stringify(next));
      } catch {
        // Storage may be unavailable; the result still holds for this session.
      }
    },
    [userId],
  );

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
      window.localStorage.removeItem(deliveryStorageKey(userId));
    } catch {
      /* nothing to clean up */
    }
  }, [userId]);

  /*
   * Restore a previously verified answer. If there isn't one the status stays
   * "unknown", which is what LocationPrompt watches for — the browser dialog is
   * raised from that prompt's button rather than automatically on load, so the
   * visitor is told why we're asking before the permission is spent.
   */
  useEffect(() => {
    /* Waits for the session to settle, then reads that account's own answer.
       Re-runs when the account changes, so signing in or out swaps the result
       rather than carrying the previous person's forward. */
    if (!authReady) return;

    let saved: Persisted | null = null;
    try {
      const raw = window.localStorage.getItem(deliveryStorageKey(userId));
      saved = raw ? (JSON.parse(raw) as Persisted) : null;
    } catch {
      saved = null;
    }

    if (saved?.status && saved.status !== "unknown" && saved.status !== "checking") {
      setStatus(saved.status);
      setDistance(saved.distance ?? null);
      setSimulated(Boolean(saved.simulated));
    } else {
      /* No answer for this account — back to unknown so the prompt asks. */
      setStatus("unknown");
      setDistance(null);
      setSimulated(false);
    }

    try {
      setDismissed(window.sessionStorage.getItem(dismissKey(userId)) === "1");
    } catch {
      setDismissed(false);
    }

    setReady(true);
  }, [authReady, userId]);

  const openLocationPrompt = useCallback(() => {
    setDismissed(false);
    try {
      window.sessionStorage.removeItem(dismissKey(userId));
    } catch {
      /* session-only anyway */
    }
  }, [userId]);

  const dismissLocationPrompt = useCallback(() => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(dismissKey(userId), "1");
    } catch {
      /* session-only anyway */
    }
  }, [userId]);

  const value = useMemo<DeliveryValue>(() => {
    const outOfRange = status === "out-of-range";
    /*
     * A customer must say where they are before adding anything to the basket.
     *
     * This used to allow ordering on an unknown location and settle it at
     * checkout, which meant someone could fill a basket the shop cannot deliver
     * and only find out at the end. Asking up front costs one click and is
     * honest about the delivery area. Staff are exempt.
     */
    const verified = status === "in-range";
    const canOrder = isAdmin || verified;
    const needsLocation = !isAdmin && !verified && !outOfRange;

    return {
      status,
      distance,
      /* Falls back to the primary store until a position is verified, so the
         name shown is always a real configured store. */
      store: store ?? primaryStore,
      canOrder,
      needsLocation,
      outOfRange,
      ready,
      simulated,
      check,
      simulateInRange,
      reset,
      /* Never raised for staff, and only while an answer is still wanted. */
      promptOpen: ready && !isAdmin && !dismissed && (status === "unknown" || status === "denied"),
      openLocationPrompt,
      dismissLocationPrompt,
    };
  }, [
    status,
    distance,
    store,
    primaryStore,
    ready,
    simulated,
    check,
    simulateInRange,
    reset,
    isAdmin,
    dismissed,
    openLocationPrompt,
    dismissLocationPrompt,
  ]);

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function useDelivery(): DeliveryValue {
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error("useDelivery must be used inside a DeliveryProvider");
  return ctx;
}
