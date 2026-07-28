"use client";

import { useCart } from "@/lib/cart";
import { useAuthGate } from "@/lib/auth-gate";

export default function WishlistButton({
  productId,
  className = "",
  withLabel = false,
}: {
  productId: string;
  className?: string;
  withLabel?: boolean;
}) {
  const { isWished, toggleWish, hydrated } = useCart();
  const { requireAuth } = useAuthGate();
  const active = hydrated && isWished(productId);

  /* Saving is tied to an account, so a signed-out visitor is routed to sign in
     rather than silently writing to a wishlist nobody will see again. */
  function handleClick() {
    if (!requireAuth("wishlist")) return;
    toggleWish(productId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
      className={`inline-flex items-center gap-1.5 transition-transform active:scale-90 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 transition-colors"
        fill={active ? "#ee1c25" : "none"}
        stroke={active ? "#ee1c25" : "currentColor"}
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M12 20.3 4.6 13a4.8 4.8 0 0 1 6.8-6.8l.6.6.6-.6A4.8 4.8 0 1 1 19.4 13z" strokeLinejoin="round" />
      </svg>
      {withLabel && <span className="text-[13px]">{active ? "Saved" : "Save"}</span>}
    </button>
  );
}
