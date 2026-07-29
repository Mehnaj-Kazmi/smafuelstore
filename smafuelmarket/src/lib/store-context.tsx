"use client";

import { createContext, useContext } from "react";
import { stores as seedStores, type StoreLocation } from "./store-location";

/*
 * Defaults to the seed store so a client component rendered outside the
 * provider still has a name and opening hours to show, rather than crashing on
 * an undefined store.
 */
const StoreContext = createContext<StoreLocation[]>(seedStores);

/**
 * Makes the live store locations available to client components.
 *
 * Fetched once on the server in the root layout, so the delivery check, the
 * header's store name and the fuel panel all measure against the same
 * coordinates the admin actually configured.
 */
export function StoreProvider({
  stores,
  children,
}: {
  stores: StoreLocation[];
  children: React.ReactNode;
}) {
  return <StoreContext.Provider value={stores}>{children}</StoreContext.Provider>;
}

export function useStores(): StoreLocation[] {
  return useContext(StoreContext);
}

export function usePrimaryStore(): StoreLocation {
  return useStores()[0] ?? seedStores[0];
}
