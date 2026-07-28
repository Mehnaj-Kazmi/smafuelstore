"use client";

import { useEffect, useState } from "react";
import SmaLogo from "./SmaLogo";

const SEEN_KEY = "sma-store:intro-played";

/** Milliseconds spent holding the brand card before the curtain opens. */
const HOLD = 1650;
/** Milliseconds the curtain takes to clear the screen. */
const SPLIT = 750;

/**
 * The opening title card.
 *
 * Modelled on the reference clip: a solid brand-colour screen builds the mark,
 * the mark blurs away, then the panel splits across the middle and the two
 * halves slide off the top and bottom to reveal the storefront underneath.
 *
 * The unmount is driven by timers, never by an `animationend` listener. An
 * overlay that waits for an animation to finish would sit on top of the site
 * forever in any environment where the animation clock does not advance —
 * a backgrounded tab, a restricted embedded view — locking the customer out of
 * the page entirely. Timers keep the teardown independent of whether the
 * animation ever ran.
 */
export default function IntroSplash() {
  const [phase, setPhase] = useState<"hidden" | "brand" | "split">("hidden");

  useEffect(() => {
    let seen = true;
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      seen = false;
    }

    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* the splash simply replays next time */
    }

    setPhase("brand");
    document.body.style.overflow = "hidden";

    const toSplit = setTimeout(() => setPhase("split"), HOLD);
    const toGone = setTimeout(() => setPhase("hidden"), HOLD + SPLIT);

    return () => {
      clearTimeout(toSplit);
      clearTimeout(toGone);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (phase === "hidden") document.body.style.overflow = "";
  }, [phase]);

  if (phase === "hidden") return null;

  const splitting = phase === "split";
  const skip = () => setPhase("hidden");

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" role="presentation" onClick={skip}>
      {/* Two panels meeting at 44% — the seam sits slightly above centre, as in
          the reference, so the reveal reads as opening rather than sliding. */}
      <div className={`intro-panel intro-panel-top ${splitting ? "is-open" : ""}`} />
      <div className={`intro-panel intro-panel-bottom ${splitting ? "is-open" : ""}`} />

      <div
        className={`pointer-events-none absolute inset-0 grid place-items-center ${
          splitting ? "intro-mark-out" : ""
        }`}
      >
        <div className="flex flex-col items-center">
          <span className="intro-mark block">
            <SmaLogo className="h-14 w-auto sm:h-[72px]" />
          </span>
          <span className="intro-tag mt-4 block text-[10px] font-extrabold uppercase text-black/70 sm:text-[11px]">
            Fuel · Market · Delivered
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={skip}
        className={`absolute bottom-7 right-7 z-10 text-[11px] font-extrabold uppercase tracking-[0.2em] text-black/50 transition-colors hover:text-black ${
          splitting ? "opacity-0" : ""
        }`}
      >
        Skip
      </button>
    </div>
  );
}
