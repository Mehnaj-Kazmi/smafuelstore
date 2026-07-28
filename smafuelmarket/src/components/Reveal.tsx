"use client";

import type { ElementType, ReactNode } from "react";
import { useInView } from "@/lib/use-in-view";

/**
 * Reveals its children with a rise-and-fade the first time they scroll into
 * view. The animation itself lives in globals.css (`.reveal`); this component
 * only flips the `data-shown` attribute that triggers it.
 *
 * See `useInView` for why visibility is detected three different ways.
 */
export default function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  /** Stagger, in milliseconds. */
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const { ref, inView, armed } = useInView();

  return (
    <Tag
      ref={ref}
      /* `reveal` carries the hidden starting state, so it is only applied once
         JS is running — otherwise a no-JS visitor would see an empty page. */
      className={`${armed ? "reveal" : ""} ${className}`.trim()}
      data-shown={inView}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
