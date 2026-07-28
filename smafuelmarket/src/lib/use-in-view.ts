"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reports the first time an element enters the viewport, then stops watching.
 *
 * Visibility must never depend on a single browser mechanism. Both of the usual
 * triggers can be silently dead in embedded or backgrounded views —
 * IntersectionObserver can report every element as non-intersecting forever, and
 * scroll events can simply never be dispatched — and anything that reveals
 * content would then stay hidden permanently. So three independent triggers run
 * together and the first to report visibility wins:
 *
 *   1. IntersectionObserver  — the efficient path
 *   2. scroll / resize       — geometry check, rAF-throttled
 *   3. a 500ms poll          — backstop for when neither of the above fires
 *
 * All three are torn down once the element is seen, so the poll costs nothing
 * after the page settles. Visitors who prefer reduced motion are reported as
 * visible immediately.
 */
export function useInView<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  /*
   * False during server render and first paint, true once this effect has run.
   * Callers must only apply their hidden starting state while `armed` is true.
   * The hidden state lives in CSS, so if it were rendered on the server a
   * visitor with JavaScript disabled would get a permanently blank element —
   * nothing would ever arrive to reveal it. Gating on `armed` means the markup
   * ships visible and only becomes animatable once JS is definitely running.
   */
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    setArmed(true);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }

    let frame = 0;
    let poll: ReturnType<typeof setInterval> | null = null;
    let observer: IntersectionObserver | null = null;
    let done = false;

    function cleanup() {
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (poll) clearInterval(poll);
      if (frame) cancelAnimationFrame(frame);
    }

    const show = () => {
      if (done) return;
      done = true;
      setInView(true);
      cleanup();
    };

    const check = () => {
      frame = 0;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) show();
    };

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(check);
    }

    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(([entry]) => entry.isIntersecting && show(), {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.05,
      });
      observer.observe(el);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    poll = setInterval(check, 500);
    check();

    return cleanup;
  }, []);

  return { ref, inView, armed };
}
