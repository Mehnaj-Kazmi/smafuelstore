"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import ProductCard from "@/components/ProductCard";
import ProductArt from "@/components/ProductArt";

export default function WishlistPage() {
  const { wishlist, hydrated } = useCart();

  if (!hydrated) {
    return <div className="mx-auto max-w-[1500px] px-3 py-10 text-sm text-sma-muted">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4">
      <div className="bg-white p-5">
        <h1 className="text-2xl font-bold">Your wishlist</h1>
        <p className="mt-1 text-sm text-sma-muted">
          {wishlist.length === 0 ? "Nothing saved yet." : `${wishlist.length} saved ${wishlist.length === 1 ? "item" : "items"}.`}
        </p>
      </div>

      {wishlist.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-4 bg-white p-10 text-center sm:flex-row sm:text-left">
          <ProductArt art="candy" hue={330} className="h-32 w-32 shrink-0" />
          <div>
            <p className="text-lg font-bold">Save things for later</p>
            <p className="mt-1 text-sm text-sma-muted">
              Tap the heart on any product to keep it here — handy for the things you always forget.
            </p>
            <Link href="/shop" className="btn-pill btn-cart mt-4 inline-block font-medium">Browse the store</Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {wishlist.map((p) => <ProductCard key={p.id} product={p} compact />)}
        </div>
      )}
    </div>
  );
}
