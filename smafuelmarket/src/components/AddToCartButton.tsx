"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { useDelivery } from "@/lib/delivery";
import { getProduct } from "@/lib/catalog";

/**
 * The single place ordering is gated. Every add-to-cart in the app goes through
 * here, so the delivery-radius rule cannot be bypassed by a surface that forgot
 * to check it.
 */
export default function AddToCartButton({
  productId,
  quantity = 1,
  className = "",
  label = "Add to cart",
  block = false,
}: {
  productId: string;
  quantity?: number;
  className?: string;
  label?: string;
  block?: boolean;
}) {
  const { add } = useCart();
  const { canOrder, ready } = useDelivery();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const product = getProduct(productId);
  const soldOut = !product || product.stock <= 0;
  const disabled = soldOut || !canOrder;

  function handleClick() {
    if (disabled) return;
    add(productId, quantity);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  }

  const text = soldOut
    ? "Out of stock"
    : !ready
      ? label
      : !canOrder
        ? "Unavailable here"
        : added
          ? "Added ✓"
          : label;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={!canOrder && !soldOut ? "Ordering is only available inside our delivery area" : undefined}
      className={`btn-pill btn-cart font-medium disabled:cursor-not-allowed disabled:opacity-45 ${
        block ? "w-full" : ""
      } ${className}`}
      aria-live="polite"
    >
      {text}
    </button>
  );
}
