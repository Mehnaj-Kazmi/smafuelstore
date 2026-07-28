/** SMA Fuel & Market wordmark — a fuel pump glyph beside the name. */
export default function SmaLogo({ className, dark = false }: { className?: string; dark?: boolean }) {
  const ink = dark ? "#131a22" : "#ffffff";
  return (
    <svg viewBox="0 0 172 46" className={className} role="img" aria-label="SMA Fuel and Market" fill="none">
      {/* Pump body */}
      <rect x="6" y="9" width="24" height="30" rx="4" fill="var(--color-sma-accent)" />
      <rect x="10.5" y="14" width="15" height="10" rx="2" fill={ink} />
      <rect x="12" y="28" width="12" height="3" rx="1.5" fill={ink} opacity="0.75" />
      {/* Hose and nozzle */}
      <path d="M30 17h5a4 4 0 0 1 4 4v11a3 3 0 0 0 6 0v-9" stroke="var(--color-sma-accent)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="45" cy="20" r="2.6" fill="var(--color-sma-accent)" />

      <text x="54" y="27" fill={ink} fontFamily="Segoe UI, Arial, sans-serif" fontSize="21" fontWeight="700" letterSpacing="0.4">
        SMA
      </text>
      <text x="54" y="40" fill="var(--color-sma-accent)" fontFamily="Segoe UI, Arial, sans-serif" fontSize="10.5" fontWeight="600" letterSpacing="2.4">
        FUEL &amp; MARKET
      </text>
    </svg>
  );
}
