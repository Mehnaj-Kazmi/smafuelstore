"use client";

import { useState } from "react";

/** Clickable 1–5 star picker for the review form. Whole stars only — unlike StarRating, nothing here is ever a display-only average. */
export default function StarInput({
  value,
  onChange,
  size = 24,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div role="radiogroup" aria-label="Your rating" className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <svg viewBox="0 0 20 20" width={size} height={size} className="shrink-0" aria-hidden="true">
            <path
              d="M10 1.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L10 14.9l-5.25 2.75 1-5.85L1.5 7.65l5.9-.85z"
              fill={n <= shown ? "#ffb020" : "#33333b"}
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
