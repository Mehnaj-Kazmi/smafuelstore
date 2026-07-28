/** The "SMA Express" delivery mark — the store's own fast-shipping programme. */
export default function PrimeBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 align-middle ${className}`}>
      <svg viewBox="0 0 22 14" className="h-3.5 w-auto" aria-hidden="true">
        <path d="M2 9c5.5 3.4 12.5 3.4 18 0" stroke="#00a8e1" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M18.6 6.4l2.6 1.9-3.2 1.4z" fill="#00a8e1" />
      </svg>
      <span className="text-[11px] font-bold text-[#00a8e1]">express</span>
    </span>
  );
}
