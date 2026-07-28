import { money } from "@/lib/format";

/** Headline figure tile. */
export function Stat({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const accent = {
    neutral: "text-white",
    good: "text-brand-green",
    warn: "text-brand-orange",
    bad: "text-sma-deal",
  }[tone];

  return (
    <div className="card p-4">
      <p className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={`mt-1.5 text-2xl font-extrabold tabular-nums ${accent}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-faint">{sub}</p>}
    </div>
  );
}

/** Status pill so state reads at a glance rather than as a word in a column. */
export function Pill({ children, tone }: { children: React.ReactNode; tone: "good" | "warn" | "bad" | "info" | "muted" }) {
  /* Tinted washes over the dark canvas — a light pastel chip would glare. */
  const cls = {
    good: "bg-brand-green/15 text-[#7ef0ac] border-brand-green/35",
    warn: "bg-brand-orange/15 text-[#ffc38c] border-brand-orange/35",
    bad: "bg-sma-deal/15 text-[#ff979c] border-sma-deal/35",
    info: "bg-[#2f7fe0]/15 text-[#9ec8f7] border-[#2f7fe0]/35",
    muted: "bg-surface-3 text-ink-soft border-line",
  }[tone];
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {children}
    </span>
  );
}

/** Horizontal magnitude bar for comparing rows in a table. */
export function Bar({ value, max, tone = "var(--color-brand-green)" }: { value: number; max: number; tone?: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <span className="block h-2 w-full overflow-hidden rounded-full bg-surface-3">
      <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: tone }} />
    </span>
  );
}

/** Simple column chart, drawn inline so no chart library is needed. */
export function Columns({ data }: { data: { label: string; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[520px] items-end gap-2" style={{ height: 180 }}>
        {data.map((d) => (
          <div key={d.label} className="group flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] font-semibold tabular-nums text-ink-soft">
              {Math.round(d.revenue / 100) / 10}k
            </span>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-brand-green-dark to-brand-green transition-[height,filter] duration-500 group-hover:brightness-125"
              style={{ height: `${(d.revenue / max) * 130}px` }}
              title={money(d.revenue)}
            />
            <span className="whitespace-nowrap text-[10px] text-ink-faint">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-extrabold text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-[13px] text-ink-soft">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
            {head.map((h) => (
              <th key={h} className="py-2.5 pr-4 font-semibold last:pr-0">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}
