"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { useDelivery } from "@/lib/delivery";
import { useAuthGate } from "@/lib/auth-gate";
import { useCatalog } from "@/lib/catalog-context";
import { useToast } from "@/lib/toast";

/**
 * The single place ordering is gated. Every add-to-cart in the app goes through
 * here, so neither the sign-in requirement nor the delivery-radius rule can be
 * bypassed by a surface that forgot to check them.
 */
export default function AddToCartButton({
  productId,
  quantity = 1,
  className = "",
  label = "Add to cart",
  block = false,
}: {
  productId: number;
  quantity?: number;
  className?: string;
  label?: string;
  block?: boolean;
}) {
  const { add, items, setQuantity, remove } = useCart();
  const { canOrder, ready, needsLocation, outOfRange, openLocationPrompt } = useDelivery();
  const { requireAuth } = useAuthGate();
  const { getProduct } = useCatalog();
  const { notify } = useToast();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const product = getProduct(productId);
  const soldOut = !product || product.stock <= 0;

  /* Out of stock and a verified out-of-area are hard stops. Being signed out or
     not having given a location are not — the button stays live and asks for
     what is missing, so the visitor learns by clicking rather than by finding a
     dead control. */
  const disabled = soldOut || outOfRange;

  function handleClick() {
    if (disabled) return;

    /* Nothing enters the basket until we know we can deliver it. */
    if (needsLocation) {
      openLocationPrompt();
      notify({
        message: "Where are we delivering?",
        detail: "Set your location and we'll check you're in our delivery area.",
        tone: "default",
      });
      return;
    }

    if (!requireAuth("cart")) return;

    /* Captured before the change so Undo restores the exact previous quantity
       rather than assuming the item was not already in the basket. */
    const before = items.find((i) => i.productId === productId)?.quantity ?? 0;

    add(productId, quantity);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);

    notify({
      message: `Added to basket`,
      detail: product ? `${quantity} × ${product.title}` : undefined,
      tone: "good",
      action: {
        label: "Undo",
        run: () => (before === 0 ? remove(productId) : setQuantity(productId, before)),
      },
    });
  }

  const text = soldOut
    ? "Out of stock"
    : !ready
      ? label
      : outOfRange
        ? "Outside delivery area"
        : needsLocation
          ? "Set delivery location"
          : added
            ? "Added ✓"
            : label;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={
        soldOut
          ? undefined
          : outOfRange
            ? "Ordering is only available inside our delivery area"
            : needsLocation
              ? "Set your delivery location to start adding items"
              : undefined
      }
      className={`btn-pill btn-cart font-medium disabled:cursor-not-allowed disabled:opacity-45 ${
        block ? "w-full" : ""
      } ${className}`}
      aria-live="polite"
    >
      {text}
    </button>
  );
}
