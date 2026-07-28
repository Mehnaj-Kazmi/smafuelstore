"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/catalog";
import ProductCard from "./ProductCard";
import WordReveal from "./WordReveal";

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
    <section className="relative">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <WordReveal
          as="h2"
          text={title}
          className="text-[22px] font-extrabold tracking-tight text-white sm:text-[26px]"
        />
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="link-draw shrink-0 text-[13px] font-bold text-brand-green"
          >
            {seeAllLabel}
          </Link>
        )}
      </div>

      <div
        ref={trackRef}
        onScroll={sync}
        className="flex snap-x gap-4 overflow-x-auto scroll-smooth no-scrollbar"
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
      className={`absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-black/70 text-white/80 shadow-xl backdrop-blur transition hover:border-white hover:text-white sm:flex ${
        dir === "left" ? "-left-3" : "-right-3"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
        <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
