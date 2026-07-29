"use client";

import { createContext, useContext } from "react";
import { deals as seedDeals, type Deal } from "./deals";

/*
 * Defaults to the seed promotions so a component rendered outside the provider
 * still shows sensible badges rather than silently showing none.
 */
const DealsContext = createContext<Deal[]>(seedDeals);

/**
 * Makes the live promotions available to client components.
 *
 * Product cards badge themselves ("Flash Sale", "Weekend Deal") from this, so
 * the badges have to come from the same source as the deals page. They used to
 * read a hardcoded list, which meant a product could advertise a promotion that
 * no longer existed in the database — and a promotion created in admin never
 * badged anything.
 */
export function DealsProvider({
  deals,
  children,
}: {
  deals: Deal[];
  children: React.ReactNode;
}) {
  return <DealsContext.Provider value={deals}>{children}</DealsContext.Provider>;
}

export function useDeals(): Deal[] {
  return useContext(DealsContext);
}
