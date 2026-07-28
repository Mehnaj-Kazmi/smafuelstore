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
    neutral: "text-[#0f1111]",
    good: "text-[#007600]",
    warn: "text-[#c45500]",
    bad: "text-sma-deal",
  }[tone];

  return (
    <div className="rounded-lg bg-white p-4">
      <p className="text-[11px] uppercase tracking-wide text-sma-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-sma-muted">{sub}</p>}
    </div>
  );
}

/** Status pill so state reads at a glance rather than as a word in a column. */
export function Pill({ children, tone }: { children: React.ReactNode; tone: "good" | "warn" | "bad" | "info" | "muted" }) {
  const cls = {
    good: "bg-[#e7f5ec] text-[#0d5c33] border-[#a9d8bd]",
    warn: "bg-[#fdf3e3] text-[#7a4a05] border-[#f0d4a3]",
    bad: "bg-[#fdeceb] text-[#9c1f16] border-[#f3bdb8]",
    info: "bg-[#e8f1f7] text-[#12556e] border-[#b6d4e4]",
    muted: "bg-[#f0f2f2] text-sma-muted border-sma-border",
  }[tone];
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

/** Horizontal magnitude bar for comparing rows in a table. */
export function Bar({ value, max, tone = "#232f3e" }: { value: number; max: number; tone?: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <span className="block h-2 w-full overflow-hidden rounded-full bg-[#f0f2f2]">
      <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: tone }} />
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
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] tabular-nums text-sma-muted">{Math.round(d.revenue / 100) / 10}k</span>
            <div
              className="w-full rounded-t bg-sma-navy-light transition-[height]"
              style={{ height: `${(d.revenue / max) * 130}px` }}
              title={money(d.revenue)}
            />
            <span className="whitespace-nowrap text-[10px] text-sma-muted">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-sma-border text-[11px] uppercase tracking-wide text-sma-muted">
            {head.map((h) => (
              <th key={h} className="py-2 pr-4 font-medium last:pr-0">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sma-border">{children}</tbody>
      </table>
    </div>
  );
}
