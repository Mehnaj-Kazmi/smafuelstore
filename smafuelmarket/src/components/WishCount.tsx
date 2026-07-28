"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

/**
 * Renders the header wishlist badge.
 *
 * Mirrors CartCount: the count must not be read during the hydration render.
 * Header sits inside a Suspense boundary, so React may hydrate it selectively —
 * after CartProvider's localStorage effect has already committed. Tracking mount
 * state locally is what makes this safe, because a component's own effect cannot
 * run before that component has hydrated, so the first client render always
 * reproduces the server output.
 */
export default function WishCount({ children }: { children: (count: number) => React.ReactNode }) {
  const { wishlist } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return <>{children(mounted ? wishlist.length : 0)}</>;
}
