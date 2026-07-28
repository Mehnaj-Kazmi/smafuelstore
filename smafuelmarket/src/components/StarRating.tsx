/** Renders a 0–5 rating with half-star precision via a clipped overlay. */
export default function StarRating({
  rating,
  size = 14,
  className = "",
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span
      className={`relative inline-block leading-none align-middle ${className}`}
      style={{ width: size * 5 + 2, height: size }}
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      <span className="absolute inset-0 flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={size} fill="#33333b" />
        ))}
      </span>
      <span className="absolute inset-0 flex overflow-hidden" style={{ width: `${pct}%` }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={size} fill="#ffb020" />
        ))}
      </span>
    </span>
  );
}

function Star({ size, fill }: { size: number; fill: string }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} className="shrink-0" aria-hidden="true">
      <path
        d="M10 1.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L10 14.9l-5.25 2.75 1-5.85L1.5 7.65l5.9-.85z"
        fill={fill}
      />
    </svg>
  );
}
