"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Panel, Pill, Stat, Table } from "@/components/admin/Ui";
import { money } from "@/lib/format";
import { api } from "@/lib/api";
import ImageUploadField from "@/components/admin/ImageUploadField";

type Department = { slug: string; name: string };
type Category = { slug: string; name: string; departmentSlug: string };

type ApiProduct = {
  id: number;
  sku: string;
  barcode: string;
  title: string;
  brand: string;
  departmentSlug: string;
  categorySlug: string;
  department: Department;
  category: Category;
  unit: string;
  price: string;
  listPrice: string | null;
  stock: number;
  lowStockAt: number;
  imageUrl?: string | null;
  art: string;
  hue: number;
  ageRestricted: boolean;
  tags: string[];
  bullets: string[];
  description: string;
};

type FormState = {
  sku: string;
  barcode: string;
  title: string;
  brand: string;
  departmentSlug: string;
  categorySlug: string;
  unit: string;
  price: string;
  listPrice: string;
  stock: string;
  lowStockAt: string;
  imageUrl: string;
  art: string;
  hue: string;
  ageRestricted: boolean;
  tags: string;
  bullets: string;
  description: string;
};

const emptyForm: FormState = {
  sku: "", barcode: "", title: "", brand: "", departmentSlug: "", categorySlug: "",
  unit: "", price: "", listPrice: "", stock: "", lowStockAt: "", imageUrl: "", art: "chips", hue: "200",
  ageRestricted: false, tags: "", bullets: "", description: "",
};

function stockState(p: ApiProduct): "out" | "low" | "ok" {
  if (p.stock <= 0) return "out";
  if (p.stock <= p.lowStockAt) return "low";
  return "ok";
}

function discountPercent(p: ApiProduct): number | null {
  const price = Number(p.price);
  const listPrice = p.listPrice ? Number(p.listPrice) : null;
  if (!listPrice || listPrice <= price) return null;
  return Math.round(((listPrice - price) / listPrice) * 100);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ApiProduct[] | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: number } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  async function loadAll() {
    setError("");
    try {
      const [p, d, c] = await Promise.all([
        api.get<ApiProduct[]>("/products"),
        api.get<Department[]>("/departments"),
        api.get<Category[]>("/categories"),
      ]);
      setProducts(p);
      setDepartments(d);
      setCategories(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const brands = useMemo(() => Array.from(new Set((products ?? []).map((p) => p.brand))), [products]);
  const categoriesForDept = useMemo(
    () => categories.filter((c) => c.departmentSlug === form.departmentSlug),
    [categories, form.departmentSlug],
  );

  function openCreate() {
    setForm(emptyForm);
    setModal({ mode: "create" });
  }

  function openEdit(p: ApiProduct) {
    setForm({
      sku: p.sku, barcode: p.barcode, title: p.title, brand: p.brand,
      departmentSlug: p.departmentSlug, categorySlug: p.categorySlug, unit: p.unit,
      price: String(p.price), listPrice: p.listPrice ? String(p.listPrice) : "",
      stock: String(p.stock), lowStockAt: String(p.lowStockAt),
      imageUrl: p.imageUrl ?? "",
      art: p.art, hue: String(p.hue), ageRestricted: p.ageRestricted,
      tags: p.tags.join(", "), bullets: p.bullets.join("\n"), description: p.description,
    });
    setModal({ mode: "edit", id: p.id });
  }

  async function remove(p: ApiProduct) {
    if (!confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      setProducts((prev) => prev?.filter((x) => x.id !== p.id) ?? null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    setError("");

    const payload = {
      sku: form.sku, barcode: form.barcode, title: form.title, brand: form.brand,
      departmentSlug: form.departmentSlug, categorySlug: form.categorySlug, unit: form.unit,
      price: Number(form.price), listPrice: form.listPrice ? Number(form.listPrice) : undefined,
      stock: Number(form.stock), lowStockAt: Number(form.lowStockAt),
      imageUrl: form.imageUrl || undefined,
      art: form.art, hue: Number(form.hue), ageRestricted: form.ageRestricted,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      bullets: form.bullets.split("\n").map((b) => b.trim()).filter(Boolean),
      description: form.description,
    };

    try {
      if (modal.mode === "create") {
        await api.post("/products", payload);
      } else {
        await api.patch(`/products/${modal.id}`, payload);
      }
      setModal(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (error && !products) {
    return (
      <Panel title="Catalogue">
        <p className="text-sm text-sma-deal">
          {error}. Is the API running at <code>{process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}</code>?
        </p>
      </Panel>
    );
  }

  if (!products) {
    return <Panel title="Catalogue"><p className="text-sm text-sma-muted">Loading…</p></Panel>;
  }

  /*
   * Matched against several fields at once, and every term must hit somewhere.
   * A catalogue is searched by whatever the operator happens to have — a SKU
   * off a shelf label, a barcode off the packet, half a brand name — so
   * restricting this to the title would miss most real lookups.
   */
  const shown = products.filter((p) => {
    if (deptFilter !== "all" && p.departmentSlug !== deptFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const hay = `${p.title} ${p.brand} ${p.sku} ${p.barcode} ${p.departmentSlug} ${p.categorySlug} ${p.unit}`.toLowerCase();
    return q.split(/\s+/).every((t) => hay.includes(t));
  });

  const discounted = products.filter((p) => discountPercent(p) !== null);
  const restricted = products.filter((p) => p.ageRestricted);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Products" value={String(products.length)} sub={`across ${departments.length} departments`} />
        <Stat label="Brands" value={String(brands.length)} />
        <Stat label="On promotion" value={String(discounted.length)} tone="warn" sub="carrying a markdown" />
        <Stat label="Age restricted" value={String(restricted.length)} sub="ID required at handover" />
      </div>

      <Panel
        title="Catalogue"
        action={
          <span className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="product-search">Search the catalogue</label>
            <input
              id="product-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, SKU, barcode, brand…"
              className="w-[min(60vw,260px)] rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-[13px] text-white outline-none transition-colors placeholder:text-ink-faint focus:border-brand-green"
            />
            <label className="sr-only" htmlFor="product-dept">Filter by department</label>
            <select
              id="product-dept"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-[13px] text-white outline-none focus:border-brand-green"
            >
              <option value="all">All departments</option>
              {departments.map((d) => (
                <option key={d.slug} value={d.slug}>{d.name}</option>
              ))}
            </select>
            {(query || deptFilter !== "all") && (
              <button
                type="button"
                onClick={() => { setQuery(""); setDeptFilter("all"); }}
                className="text-[12px] font-bold text-ink-faint hover:text-white"
              >
                Clear
              </button>
            )}
            <button type="button" onClick={openCreate} className="btn-pill btn-cart text-[13px] font-medium">
              + Add product
            </button>
          </span>
        }
      >
        {shown.length === 0 ? (
          <p className="py-6 text-[13px] text-ink-faint">
            Nothing matches that search. {products.length} products in the catalogue.
          </p>
        ) : (
        <>
        <p className="mb-3 text-[12px] text-ink-faint">
          Showing {shown.length} of {products.length} products
        </p>
        <Table head={["Product", "SKU", "Department", "Brand", "Price", "Stock", ""]}>
          {shown.map((p) => {
            const state = stockState(p);
            const off = discountPercent(p);
            return (
              <tr key={p.id}>
                <td className="py-2 pr-4">
                  <Link href={`/product/${p.id}`} className="line-clamp-1 font-medium hover:text-sma-link-hover">{p.title}</Link>
                  <span className="text-[11px] text-sma-muted">{p.unit}</span>
                  {p.ageRestricted && <span className="ml-2"><Pill tone="warn">21+</Pill></span>}
                </td>
                <td className="py-2 pr-4 font-mono text-xs">{p.sku}</td>
                <td className="py-2 pr-4">{p.department?.name ?? p.departmentSlug}</td>
                <td className="py-2 pr-4">{p.brand}</td>
                <td className="py-2 pr-4 tabular-nums">
                  {money(Number(p.price))}
                  {off !== null && <span className="ml-1 text-[11px] font-medium text-sma-deal">-{off}%</span>}
                </td>
                <td className="py-2 pr-4 tabular-nums">
                  {state === "out" ? <Pill tone="bad">0</Pill> : state === "low" ? <Pill tone="warn">{p.stock}</Pill> : p.stock}
                </td>
                <td className="py-2">
                  <span className="flex gap-2 text-[13px]">
                    <button type="button" onClick={() => openEdit(p)} className="text-sma-link hover:underline">Edit</button>
                    <button type="button" onClick={() => remove(p)} className="text-sma-link hover:underline">Delete</button>
                  </span>
                </td>
              </tr>
            );
          })}
        </Table>
        </>
        )}
      </Panel>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-8">
          <div className="w-full max-w-2xl rounded-lg bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{modal.mode === "create" ? "Add product" : "Edit product"}</h2>
              <button type="button" onClick={() => setModal(null)} className="text-sm text-sma-muted hover:text-sma-link">Close</button>
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
              <TextField label="Brand" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} required />
              <TextField label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} required />
              <TextField label="Barcode" value={form.barcode} onChange={(v) => setForm({ ...form, barcode: v })} required />

              <SelectField
                label="Department"
                value={form.departmentSlug}
                onChange={(v) => setForm({ ...form, departmentSlug: v, categorySlug: "" })}
                options={departments.map((d) => ({ value: d.slug, label: d.name }))}
                required
              />
              <SelectField
                label="Category"
                value={form.categorySlug}
                onChange={(v) => setForm({ ...form, categorySlug: v })}
                options={categoriesForDept.map((c) => ({ value: c.slug, label: c.name }))}
                required
                disabled={!form.departmentSlug}
              />

              <TextField label="Unit (e.g. 20 fl oz bottle)" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} required />
              <TextField label="Art icon" value={form.art} onChange={(v) => setForm({ ...form, art: v })} required />

              <ImageUploadField
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                className="sm:col-span-2"
              />

              <TextField label="Price" type="number" step="0.01" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
              <TextField label="List price (optional)" type="number" step="0.01" value={form.listPrice} onChange={(v) => setForm({ ...form, listPrice: v })} />

              <div>
                <TextField label="Stock on hand" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} required />
                {form.stock.trim() === "0" && (
                  <p className="mt-1 text-[11px] font-semibold text-brand-orange">
                    Zero means this product shows as “Out of stock” and cannot be ordered.
                  </p>
                )}
              </div>
              <TextField label="Low stock warning at" type="number" value={form.lowStockAt} onChange={(v) => setForm({ ...form, lowStockAt: v })} required />

              <label className="flex items-center gap-2 text-[13px] sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.ageRestricted}
                  onChange={(e) => setForm({ ...form, ageRestricted: e.target.checked })}
                />
                Age restricted (ID required)
              </label>

              <TextField label="Tags (comma separated)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} className="sm:col-span-2" />

              <div className="sm:col-span-2">
                <label className="mb-1 block text-[13px] font-bold">Bullets (one per line)</label>
                <textarea
                  value={form.bullets}
                  onChange={(e) => setForm({ ...form, bullets: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-white outline-none focus:border-brand-green"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-[13px] font-bold">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  required
                  className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-white outline-none focus:border-brand-green"
                />
              </div>

              {error && <p className="text-[13px] text-sma-deal sm:col-span-2">{error}</p>}

              <div className="flex gap-2 sm:col-span-2">
                <button type="submit" disabled={saving} className="btn-pill btn-buy font-medium disabled:opacity-60">
                  {saving ? "Saving…" : modal.mode === "create" ? "Add product" : "Save changes"}
                </button>
                <button type="button" onClick={() => setModal(null)} className="btn-pill btn-ghost font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TextField({
  label, value, onChange, type = "text", step, required, className,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; step?: string; required?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[13px] font-bold">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-white outline-none focus:border-brand-green"
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, options, required, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; required?: boolean; disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-[13px] font-bold">{label}</label>
      <select
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-white outline-none focus:border-brand-green disabled:opacity-50"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
