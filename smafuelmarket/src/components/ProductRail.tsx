"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/catalog";
import ProductCard from "./ProductCard";

/** A white panel holding a horizontally scrollable row of product cards. */
export default function ProductRail({
  title,
  products,
  seeAllHref,
  seeAllLabel = "See more",
}: {
  title: string;
  products: Product[];
  seeAllHref?: string;
  seeAllLabel?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync]);

  function scrollBy(dir: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section className="relative bg-white px-4 py-4">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-bold sm:text-[21px]">{title}</h2>
        {seeAllHref && (
          <Link href={seeAllHref} className="shrink-0 text-[13px] text-sma-link hover:text-sma-link-hover hover:underline">
            {seeAllLabel}
          </Link>
        )}
      </div>

      <div
        ref={trackRef}
        onScroll={sync}
        className="flex snap-x gap-3 overflow-x-auto scroll-smooth no-scrollbar"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[168px] shrink-0 snap-start sm:w-[200px]">
            <ProductCard product={p} compact />
          </div>
        ))}
      </div>

      {!atStart && <RailArrow dir="left" onClick={() => scrollBy(-1)} />}
      {!atEnd && <RailArrow dir="right" onClick={() => scrollBy(1)} />}
    </section>
  );
}

function RailArrow({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "Scroll left" : "Scroll right"}
      className={`absolute top-1/2 hidden h-20 w-9 -translate-y-1/2 items-center justify-center rounded-md border border-sma-border bg-white/95 shadow-md transition hover:bg-gray-50 sm:flex ${
        dir === "left" ? "left-1" : "right-1"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#0f1111" strokeWidth="2" aria-hidden="true">
        <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
