"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ProductArt from "./ProductArt";
import type { ArtKey } from "@/lib/catalog";
import { primaryStore } from "@/lib/store-location";

type Slide = {
  eyebrow: string;
  title: string;
  cta: string;
  href: string;
  from: string;
  to: string;
  props: { art: ArtKey; hue: number }[];
};

const slides: Slide[] = [
  {
    eyebrow: "Open 24 hours · Delivered in 30 minutes",
    title: "The whole store,\nbrought to your door",
    cta: "Start shopping",
    href: "/shop",
    from: "#0f4c3a",
    to: "#1f8a5f",
    props: [
      { art: "coffee", hue: 30 },
      { art: "donut", hue: 25 },
      { art: "soda", hue: 205 },
      { art: "chips", hue: 45 },
    ],
  },
  {
    eyebrow: "Breakfast served from 5am",
    title: "Hot food and\nfresh coffee",
    cta: "Shop the bakery",
    href: "/department/bakery",
    from: "#8a3f12",
    to: "#e08a2c",
    props: [
      { art: "sandwich", hue: 40 },
      { art: "muffin", hue: 280 },
      { art: "hotdog", hue: 15 },
      { art: "coffee", hue: 25 },
    ],
  },
  {
    eyebrow: "Everything for the road",
    title: "Automotive essentials\nwithout the detour",
    cta: "Shop automotive",
    href: "/department/automotive",
    from: "#1e3a6b",
    to: "#3f7fc4",
    props: [
      { art: "oil", hue: 200 },
      { art: "wiper", hue: 210 },
      { art: "phoneCharger", hue: 220 },
      { art: "coolant", hue: 195 },
    ],
  },
  {
    eyebrow: `Regular $${primaryStore.fuelPrices[0].price.toFixed(2)}/gal today`,
    title: "Fill up, then\nfill the basket",
    cta: "See today's deals",
    href: "/deals",
    from: "#6b2f6b",
    to: "#a855a8",
    props: [
      { art: "energy", hue: 265 },
      { art: "candy", hue: 330 },
      { art: "jerky", hue: 20 },
      { art: "gum", hue: 175 },
    ],
  },
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((dir: number) => {
    setIndex((i) => (i + dir + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => go(1), 6000);
    return () => clearInterval(id);
  }, [go, paused]);

  const slide = slides[index];

  return (
    <section
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured promotions"
    >
      <div
        className="relative h-[260px] overflow-hidden transition-[background] duration-500 sm:h-[330px] lg:h-[410px]"
        style={{ background: `linear-gradient(110deg, ${slide.from}, ${slide.to})` }}
      >
        <div className="mx-auto flex h-full max-w-[1500px] items-center gap-6 px-10 pb-16 sm:px-14 sm:pb-24 lg:px-20 lg:pb-28">
          <div className="z-10 max-w-full shrink-0 text-white sm:max-w-[46%]">
            <p className="mb-1 text-sm font-semibold sm:text-base">{slide.eyebrow}</p>
            <h2 className="whitespace-pre-line text-xl font-bold leading-tight sm:text-3xl lg:text-[40px]">
              {slide.title}
            </h2>
            <Link
              href={slide.href}
              className="mt-4 inline-block whitespace-nowrap rounded-full bg-white/95 px-4 py-1.5 text-xs font-semibold text-[#0f1111] transition hover:bg-white sm:text-sm"
            >
              {slide.cta}
            </Link>

            <div className="mt-4 flex gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.href}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index}
                  className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/50"}`}
                />
              ))}
            </div>
          </div>

          <div className="hidden flex-1 items-center justify-end gap-3 sm:flex lg:gap-6">
            {slide.props.map((p, i) => (
              <div
                key={`${index}-${i}`}
                className="w-[22%] max-w-[150px] -rotate-3 rounded-xl bg-white/15 p-2 backdrop-blur-sm even:rotate-3"
              >
                <ProductArt art={p.art} hue={p.hue} className="h-full w-full" bare />
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-sma-canvas" />
      </div>

      <button type="button" onClick={() => go(-1)} aria-label="Previous promotion" className="absolute left-0 top-0 flex h-[75%] w-10 items-center justify-center text-white/85 transition hover:bg-white/10 hover:text-white sm:w-14">
        <Chevron dir="left" />
      </button>
      <button type="button" onClick={() => go(1)} aria-label="Next promotion" className="absolute right-0 top-0 flex h-[75%] w-10 items-center justify-center text-white/85 transition hover:bg-white/10 hover:text-white sm:w-14">
        <Chevron dir="right" />
      </button>
    </section>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
