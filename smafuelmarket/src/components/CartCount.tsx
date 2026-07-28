"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

/**
 * Renders the header cart badge.
 *
 * The count must not be read during the hydration render. Header sits inside a
 * Suspense boundary, so React may hydrate it selectively — after CartProvider's
 * localStorage effect has already committed. Relying on the provider's
 * `hydrated` flag therefore mismatches: the server emitted 0 while the client
 * already knows the restored count.
 *
 * Tracking mount state locally is what makes this safe — a component's own
 * effect cannot run before that component has hydrated, so the first client
 * render always reproduces the server output.
 */
export default function CartCount({ children }: { children: (count: number) => React.ReactNode }) {
  const { count } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return <>{children(mounted ? count : 0)}</>;
}
