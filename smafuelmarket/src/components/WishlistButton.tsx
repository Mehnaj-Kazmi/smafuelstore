"use client";

import { useCart } from "@/lib/cart";

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
  const active = hydrated && isWished(productId);

  return (
    <button
      type="button"
      onClick={() => toggleWish(productId)}
      aria-pressed={active}
      aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
      className={`inline-flex items-center gap-1.5 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={active ? "#c7511f" : "none"}
        stroke={active ? "#c7511f" : "currentColor"}
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M12 20.3 4.6 13a4.8 4.8 0 0 1 6.8-6.8l.6.6.6-.6A4.8 4.8 0 1 1 19.4 13z" strokeLinejoin="round" />
      </svg>
      {withLabel && <span className="text-[13px]">{active ? "Saved" : "Save"}</span>}
    </button>
  );
}
