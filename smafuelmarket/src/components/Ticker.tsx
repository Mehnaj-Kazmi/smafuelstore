/**
 * Infinite scrolling promo strip. The items are rendered twice so the track
 * can loop seamlessly — the CSS animation translates it by exactly -50%.
 * Hovering pauses it (see `.marquee` in globals.css).
 */
export default function Ticker({
  items,
  duration = 34,
}: {
  items: string[];
  /** Seconds for one full loop. Lower is faster. */
  duration?: number;
}) {
  return (
    <div
      className="marquee relative overflow-hidden border-y border-line bg-brand-green py-2.5"
      aria-label="Store highlights"
    >
      <div
        className="marquee-track"
        style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
            {items.map((item) => (
              <span
                key={`${copy}-${item}`}
                className="flex items-center gap-6 whitespace-nowrap px-6 text-[13px] font-extrabold uppercase tracking-[0.14em] text-black"
              >
                {item}
                <span className="text-black/40">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
