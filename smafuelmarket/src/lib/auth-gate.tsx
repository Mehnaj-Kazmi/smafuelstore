"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAuth } from "./auth";

/**
 * The single place "you need an account for this" is enforced on the storefront.
 *
 * Anything that commits a customer to something — adding to the cart, buying,
 * saving a wishlist item — calls `requireAuth()` first. A signed-out visitor is
 * sent to /signin with enough context to come straight back to what they were
 * doing, so the interruption costs them one step rather than their place.
 */
export type AuthIntent = "cart" | "buy" | "wishlist" | "checkout" | "review";

const intentCopy: Record<AuthIntent, string> = {
  cart: "Sign in to add items to your cart",
  buy: "Sign in to complete your order",
  wishlist: "Sign in to save items you like",
  checkout: "Sign in to check out",
  review: "Sign in to write a review",
};

export function intentMessage(intent: string | null): string | null {
  if (!intent) return null;
  return intentCopy[intent as AuthIntent] ?? null;
}

export function useAuthGate() {
  const { user, hydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Returns true when the visitor may proceed. Otherwise it routes them to
   * sign in and returns false, so callers read as:
   *
   *   if (!requireAuth("cart")) return;
   *
   * `returnTo` overrides where signing in lands them. It matters when the
   * gated action would have navigated somewhere — checkout sends them onward
   * to /checkout rather than back to the cart they started from.
   */
  const requireAuth = useCallback(
    (intent: AuthIntent, returnTo?: string) => {
      if (user) return true;
      const params = new URLSearchParams({ next: returnTo ?? pathname, intent });
      router.push(`/signin?${params.toString()}`);
      return false;
    },
    [user, router, pathname],
  );

  return { user, hydrated, signedIn: Boolean(user), requireAuth };
}
