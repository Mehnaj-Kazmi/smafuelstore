"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Panel, Pill, Stat, Table } from "@/components/admin/Ui";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { imageSrc } from "@/components/ProductImage";

type DealKind = "flash" | "percent" | "bogo" | "weekend";

type DealProduct = { id: number; title: string; price: string | number };

type ApiDeal = {
  id: number;
  kind: DealKind;
  title: string;
  detail: string;
  percentOff: number | null;
  endsInHours: number | null;
  imageUrl: string | null;
  active: boolean;
  products: DealProduct[];
};

type ApiProduct = { id: number; title: string; brand: string };

const kindLabel: Record<DealKind, string> = {
  flash: "Flash Sale",
  percent: "% Off",
  bogo: "Buy One Get One",
  weekend: "Weekend Deal",
};

const kindTone: Record<DealKind, "bad" | "good" | "info" | "warn"> = {
  flash: "bad",
  percent: "warn",
  bogo: "good",
  weekend: "info",
};

type FormState = {
  kind: DealKind;
  title: string;
  detail: string;
  percentOff: string;
  endsInHours: string;
  imageUrl: string;
  active: boolean;
  productIds: number[];
};

const emptyForm: FormState = {
  kind: "percent",
  title: "",
  detail: "",
  percentOff: "",
  endsInHours: "",
  imageUrl: "",
  active: true,
  productIds: [],
};

export default function DealsAdmin() {
  const [deals, setDeals] = useState<ApiDeal[] | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; id: number } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const [d, p] = await Promise.all([
        api.get<ApiDeal[]>("/deals?includeInactive=true"),
        api.get<ApiProduct[]>("/products"),
      ]);
      setDeals(d);
      setProducts(p);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deals");
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const stats = useMemo(() => {
    const list = deals ?? [];
    return {
      active: list.filter((d) => d.active).length,
      flash: list.filter((d) => d.kind === "flash").length,
      withArt: list.filter((d) => d.imageUrl).length,
      products: new Set(list.flatMap((d) => d.products.map((p) => p.id))).size,
    };
  }, [deals]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = deals ?? [];
    if (!q) return list;
    return list.filter((d) => {
      const hay = `${d.title} ${d.detail} ${kindLabel[d.kind]} ${d.products.map((p) => p.title).join(" ")}`.toLowerCase();
      return q.split(/\s+/).every((t) => hay.includes(t));
    });
  }, [deals, query]);

  function openCreate() {
    setForm(emptyForm);
    setError("");
    setModal({ mode: "create" });
  }

  function openEdit(d: ApiDeal) {
    setForm({
      kind: d.kind,
      title: d.title,
      detail: d.detail,
      percentOff: d.percentOff != null ? String(d.percentOff) : "",
      endsInHours: d.endsInHours != null ? String(d.endsInHours) : "",
      imageUrl: d.imageUrl ?? "",
      active: d.active,
      productIds: d.products.map((p) => p.id),
    });
    setError("");
    setModal({ mode: "edit", id: d.id });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;

    if (form.productIds.length === 0) {
      setError("Pick at least one product for this promotion");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      kind: form.kind,
      title: form.title,
      detail: form.detail,
      percentOff: form.percentOff ? Number(form.percentOff) : undefined,
      endsInHours: form.endsInHours ? Number(form.endsInHours) : undefined,
      imageUrl: form.imageUrl || undefined,
      active: form.active,
      productIds: form.productIds,
    };

    try {
      if (modal.mode === "create") await api.post("/deals", payload);
      else await api.patch(`/deals/${modal.id}`, payload);
      setModal(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  /** "End" flips the promotion inactive rather than deleting its history. */
  async function toggleActive(d: ApiDeal) {
    try {
      await api.patch(`/deals/${d.id}`, { active: !d.active });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the deal");
    }
  }

  async function remove(d: ApiDeal) {
    if (!confirm(`Delete "${d.title}"? This can't be undone.`)) return;
    try {
      await api.delete(`/deals/${d.id}`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (error && !deals) {
    return (
      <Panel title="Promotions">
        <p className="text-[13px] font-semibold text-sma-deal">{error}</p>
        <p className="mt-2 text-xs text-ink-faint">
          Is the API running at {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}?
        </p>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active deals" value={String(stats.active)} tone="good" />
        <Stat label="Flash sales" value={String(stats.flash)} tone="warn" sub="time limited" />
        <Stat label="With artwork" value={String(stats.withArt)} sub={`of ${deals?.length ?? 0}`} />
        <Stat label="Products on offer" value={String(stats.products)} />
      </div>

      {error && deals && (
        <p role="alert" className="text-[13px] font-semibold text-sma-deal">{error}</p>
      )}

      <Panel
        title="Promotions"
        action={
          <span className="flex flex-wrap items-center gap-2">
            {deals && deals.length > 0 && (
              <>
                <label className="sr-only" htmlFor="deal-search">Search promotions</label>
                <input
                  id="deal-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search title, detail, product…"
                  className="w-[min(60vw,240px)] rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-[13px] text-white outline-none transition-colors placeholder:text-ink-faint focus:border-brand-green"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-[12px] font-bold text-ink-faint hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </>
            )}
            <button type="button" onClick={openCreate} className="btn-pill btn-cart text-[13px]">
              + New deal
            </button>
          </span>
        }
      >
        {!deals ? (
          <p className="text-[13px] text-ink-faint">Loading deals…</p>
        ) : deals.length === 0 ? (
          <p className="text-[13px] text-ink-faint">No promotions yet. Create one to get started.</p>
        ) : shown.length === 0 ? (
          <p className="text-[13px] text-ink-faint">Nothing matches that search. {deals.length} promotions total.</p>
        ) : (
          <>
          <p className="mb-3 text-[12px] text-ink-faint">Showing {shown.length} of {deals.length} promotions</p>
          <Table head={["", "Deal", "Type", "Products", "Discount", "Ends", "Status", ""]}>
            {shown.map((d) => (
              <tr key={d.id} className={d.active ? "" : "opacity-55"}>
                <td className="py-2.5 pr-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-surface-2">
                    {d.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */
                      <img src={imageSrc(d.imageUrl)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[9px] text-ink-faint">No art</span>
                    )}
                  </span>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="block font-semibold text-white">{d.title}</span>
                  <span className="line-clamp-1 text-[11px] text-ink-faint">{d.detail}</span>
                </td>
                <td className="py-2.5 pr-4">
                  <Pill tone={kindTone[d.kind]}>{kindLabel[d.kind]}</Pill>
                </td>
                <td className="py-2.5 pr-4 text-xs text-ink-soft">
                  {d.products.length === 1
                    ? d.products[0].title
                    : `${d.products.length} products`}
                </td>
                <td className="py-2.5 pr-4 tabular-nums">{d.percentOff ? `${d.percentOff}%` : "—"}</td>
                <td className="py-2.5 pr-4 text-ink-faint">
                  {d.endsInHours != null ? `${d.endsInHours}h` : "Ongoing"}
                </td>
                <td className="py-2.5 pr-4">
                  <Pill tone={d.active ? "good" : "muted"}>{d.active ? "Live" : "Ended"}</Pill>
                </td>
                <td className="py-2.5">
                  <span className="flex gap-3 text-[13px] font-semibold">
                    <button type="button" onClick={() => openEdit(d)} className="text-brand-green hover:underline">
                      Edit
                    </button>
                    <button type="button" onClick={() => toggleActive(d)} className="text-ink-soft hover:text-white hover:underline">
                      {d.active ? "End" : "Resume"}
                    </button>
                    <button type="button" onClick={() => remove(d)} className="text-sma-deal hover:underline">
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </Table>
          </>
        )}
      </Panel>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setModal(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <form
            onSubmit={save}
            className="card relative my-8 w-full max-w-[640px] p-6"
          >
            <h2 className="mb-5 text-xl font-extrabold text-white">
              {modal.mode === "create" ? "New promotion" : "Edit promotion"}
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />

              <div>
                <label htmlFor="deal-kind" className="mb-1.5 block text-[13px] font-bold text-ink-soft">Type</label>
                <select
                  id="deal-kind"
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value as DealKind })}
                  className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-white outline-none focus:border-brand-green"
                >
                  {(Object.keys(kindLabel) as DealKind[]).map((k) => (
                    <option key={k} value={k}>{kindLabel[k]}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="deal-detail" className="mb-1.5 block text-[13px] font-bold text-ink-soft">Detail</label>
                <textarea
                  id="deal-detail"
                  value={form.detail}
                  onChange={(e) => setForm({ ...form, detail: e.target.value })}
                  rows={2}
                  required
                  className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-white outline-none focus:border-brand-green"
                />
              </div>

              <Field
                label="Percent off (optional)"
                type="number"
                value={form.percentOff}
                onChange={(v) => setForm({ ...form, percentOff: v })}
              />
              <Field
                label="Ends in hours (blank = ongoing)"
                type="number"
                value={form.endsInHours}
                onChange={(v) => setForm({ ...form, endsInHours: v })}
              />

              <ImageUploadField
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                className="sm:col-span-2"
              />

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">
                  Products in this promotion ({form.productIds.length} selected)
                </label>
                <div className="max-h-52 overflow-y-auto rounded-lg border border-line bg-surface-2 p-2">
                  {products.map((p) => {
                    const checked = form.productIds.includes(p.id);
                    return (
                      <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-[13px] text-ink-soft hover:bg-surface-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm({
                              ...form,
                              productIds: checked
                                ? form.productIds.filter((id) => id !== p.id)
                                : [...form.productIds, p.id],
                            })
                          }
                        />
                        <span className="truncate">{p.title}</span>
                        <span className="ml-auto shrink-0 text-[11px] text-ink-faint">{p.brand}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 text-[13px] text-ink-soft sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                Live on the storefront
              </label>
            </div>

            {error && <p role="alert" className="mt-4 text-[13px] font-semibold text-sma-deal">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setModal(null)} className="btn-pill btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-pill btn-cart disabled:opacity-60">
                {saving ? "Saving…" : modal.mode === "create" ? "Create deal" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required = false,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-bold text-ink-soft">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-white outline-none focus:border-brand-green"
      />
    </div>
  );
}
