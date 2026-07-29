"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ProductImage from "./ProductImage";
import WordReveal from "./WordReveal";
import type { ArtKey } from "@/lib/catalog";
import type { HeroSlide } from "@/lib/home-content";

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => go(1), 6500);
    return () => clearInterval(id);
  }, [go, paused]);

  /* A slide can disappear while the carousel is mid-rotation if the content is
     edited in admin, so fall back to the first rather than indexing past the end. */
  const slide = slides[index] ?? slides[0];
  if (!slide) return null;

  return (
    <section
      className="relative overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured promotions"
    >
      {/* Ambient glow, tinted to the active slide. */}
      <div
        className="pointer-events-none absolute -right-[12%] top-1/2 h-[130%] w-[70%] -translate-y-1/2 rounded-full opacity-40 blur-[110px] transition-[background] duration-700"
        style={{ background: slide.accent }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-[1500px] items-center gap-6 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,46%)_minmax(0,1fr)] lg:gap-10 lg:px-12 lg:py-20">
        {/* Copy — re-keyed on index so the entrance replays each slide. */}
        <div key={`copy-${index}`} className="z-10 max-w-xl">
          <p className="anim-rise eyebrow" style={{ animationDelay: "40ms" }}>
            {slide.eyebrow}
          </p>

          <WordReveal
            as="h1"
            text={slide.title}
            delay={110}
            className="mt-3 text-[34px] font-extrabold leading-[0.95] tracking-tight text-white sm:text-[52px] lg:text-[64px]"
          />

          <p
            className="anim-rise mt-4 max-w-md text-sm leading-6 text-ink-soft sm:text-base"
            style={{ animationDelay: "190ms" }}
          >
            {slide.blurb}
          </p>

          <div
            className="anim-rise mt-7 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "270ms" }}
          >
            <Link href={slide.ctaHref} className="btn-pill btn-buy px-7 py-3 text-sm">
              {slide.ctaLabel}
            </Link>
            <Link href="/contact" className="btn-pill btn-ghost px-7 py-3 text-sm">
              Find a store
            </Link>
          </div>

          {/* Progress bars double as slide controls. */}
          <div className="mt-9 flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === index ? "w-10 bg-brand-green" : "w-5 bg-white/25 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Art: promo badge plus floating product tiles. */}
        <div
          key={`art-${index}`}
          className="relative z-10 hidden min-h-[320px] items-center justify-center lg:flex"
        >
          <div
            className="anim-pop absolute left-0 top-2 z-20 grid h-[132px] w-[132px] place-items-center rounded-[26px] px-3 text-center shadow-2xl"
            style={{ background: slide.accent, animationDelay: "120ms" }}
          >
            <span>
              <span className="block text-[40px] font-extrabold leading-none tracking-tight text-white">
                {slide.badgeBig}
              </span>
              <span className="mt-1.5 block text-[10px] font-extrabold leading-tight tracking-[0.1em] text-white/90">
                {slide.badgeSmall}
              </span>
            </span>
          </div>

          {/*
            The products sit directly on the slide and overlap along their
            edges, rather than each being boxed in its own panel. The artwork is
            cut out, so a panel would only put back the white rectangle the
            cut-out removed.

            Overlap is a negative margin with a descending z-index, so each item
            tucks behind the one to its left and the row reads front-to-back.
          */}
          <div className="flex w-full items-center justify-end pl-8">
            {Array.from({ length: 4 }).map((_, i) => {
              const image = slide.tileImages?.[i];
              const art = (slide.fallbackArt?.[i] ?? "chips") as ArtKey;
              if (!image && !slide.fallbackArt?.[i]) return null;

              return (
                <div
                  key={`${index}-${i}`}
                  /*
                   * `shrink-0` matters: without it flexbox resolves the
                   * combined width being over 100% by shrinking every tile,
                   * which silently undoes both the size and the overlap.
                   *
                   * The overlap is generous because `object-contain` letterboxes
                   * each product inside its square — the boxes have to overlap
                   * considerably before the products themselves appear to.
                   */
                  className="anim-pop -ml-[9%] w-[32%] max-w-[270px] shrink-0 first:ml-0"
                  style={{ animationDelay: `${180 + i * 90}ms`, zIndex: 10 - i }}
                >
                  <div
                    className="anim-float"
                    style={
                      {
                        "--tilt": i % 2 === 0 ? "-5deg" : "5deg",
                        animationDelay: `${i * 420}ms`,
                        /* Grounds the cut-out against the slide, which it needs
                           now that there is no panel edge to define it. */
                        filter: "drop-shadow(0 18px 22px rgb(0 0 0 / 0.45))",
                      } as React.CSSProperties
                    }
                  >
                    <ProductImage
                      imageUrl={image || null}
                      art={art}
                      hue={200}
                      alt=""
                      bare
                      transparent
                      className="aspect-square h-full w-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous promotion"
        className="absolute left-1 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-black/50 text-white/80 backdrop-blur transition hover:border-white hover:text-white sm:grid"
      >
        <Chevron dir="left" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next promotion"
        className="absolute right-1 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-black/50 text-white/80 backdrop-blur transition hover:border-white hover:text-white sm:grid"
      >
        <Chevron dir="right" />
      </button>
    </section>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
