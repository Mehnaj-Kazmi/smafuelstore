"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  categoriesIn, departments, sortProducts, stockState,
  type DepartmentSlug, type Product, type SortKey,
} from "@/lib/catalog";
import ProductCard from "./ProductCard";
import StarRating from "./StarRating";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Customer Rating" },
  { value: "name", label: "Name A–Z" },
];

const priceBands = [
  { label: "Under $3", max: 3 },
  { label: "$3 to $6", min: 3, max: 6 },
  { label: "$6 to $12", min: 6, max: 12 },
  { label: "$12 to $25", min: 12, max: 25 },
  { label: "$25 & above", min: 25 },
];

export default function ResultsBrowser({
  pool,
  heading,
  resultLabel,
  department,
  showDepartmentFilter = true,
  initialSort = "featured",
}: {
  pool: Product[];
  heading: string;
  resultLabel?: string;
  /** When set, the category filter narrows to that department's categories. */
  department?: DepartmentSlug;
  showDepartmentFilter?: boolean;
  initialSort?: SortKey;
}) {
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [band, setBand] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [hideRestricted, setHideRestricted] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(null);

  const availableBrands = useMemo(
    () => Array.from(new Set(pool.map((p) => p.brand))).sort(),
    [pool],
  );

  const categoryOptions = useMemo(
    () => (department ? categoriesIn(department) : []),
    [department],
  );

  const results = useMemo(() => {
    const list = pool.filter((p) => {
      if (category && p.category !== category) return false;
      if (inStockOnly && stockState(p) === "out") return false;
      if (hideRestricted && p.ageRestricted) return false;
      if (minRating != null && p.rating < minRating) return false;
      if (brands.length > 0 && !brands.includes(p.brand)) return false;
      if (band != null) {
        const b = priceBands[band];
        if (b.min != null && p.price < b.min) return false;
        if (b.max != null && p.price > b.max) return false;
      }
      return true;
    });
    return sortProducts(list, sort);
  }, [pool, sort, band, minRating, inStockOnly, hideRestricted, brands, category]);

  const hasFilters =
    band != null || minRating != null || inStockOnly || hideRestricted || brands.length > 0 || category != null;

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4">
      <div className="bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sma-border px-4 py-3">
          <div>
            <h1 className="text-lg font-bold sm:text-xl">{heading}</h1>
            <p className="text-[13px] text-sma-muted">
              {results.length} {results.length === 1 ? "item" : "items"}
              {resultLabel ? ` · ${resultLabel}` : ""}
            </p>
          </div>
          <label className="flex items-center gap-2 text-[13px]">
            <span className="font-bold">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="cursor-pointer rounded-md border border-sma-border bg-[#f0f2f2] px-2 py-1.5 text-[13px] outline-none"
            >
              {sortOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-4 p-4 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-[220px]">
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setBand(null); setMinRating(null); setInStockOnly(false);
                  setHideRestricted(false); setBrands([]); setCategory(null);
                }}
                className="mb-4 text-[13px] text-sma-link hover:text-sma-link-hover hover:underline"
              >
                Clear all filters
              </button>
            )}

            {categoryOptions.length > 0 && (
              <Group title="Category">
                {categoryOptions.map((c) => (
                  <li key={c.slug}>
                    <button
                      type="button"
                      onClick={() => setCategory(category === c.slug ? null : c.slug)}
                      className={`block py-[3px] text-[13px] hover:text-sma-link-hover hover:underline ${category === c.slug ? "font-bold" : ""}`}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </Group>
            )}

            {showDepartmentFilter && (
              <Group title="Department">
                {departments.map((d) => (
                  <li key={d.slug}>
                    <Link href={`/department/${d.slug}`} className="block py-[3px] text-[13px] hover:text-sma-link-hover hover:underline">
                      {d.name}
                    </Link>
                  </li>
                ))}
              </Group>
            )}

            <Group title="Customer rating">
              {[4, 3, 2].map((r) => (
                <li key={r}>
                  <button
                    type="button"
                    onClick={() => setMinRating(minRating === r ? null : r)}
                    className={`flex items-center gap-1.5 py-[3px] text-[13px] hover:underline ${minRating === r ? "font-bold" : ""}`}
                  >
                    <StarRating rating={r} />
                    <span className="text-sma-muted">&amp; Up</span>
                  </button>
                </li>
              ))}
            </Group>

            <Group title="Price">
              {priceBands.map((b, i) => (
                <li key={b.label}>
                  <button
                    type="button"
                    onClick={() => setBand(band === i ? null : i)}
                    className={`block py-[3px] text-[13px] hover:text-sma-link-hover hover:underline ${band === i ? "font-bold" : ""}`}
                  >
                    {b.label}
                  </button>
                </li>
              ))}
            </Group>

            <Group title="Brand">
              {availableBrands.map((b) => (
                <li key={b}>
                  <label className="flex cursor-pointer items-center gap-2 py-[3px] text-[13px]">
                    <input
                      type="checkbox"
                      checked={brands.includes(b)}
                      onChange={() => setBrands((cur) => cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b])}
                      className="h-3.5 w-3.5 accent-sma-navy-light"
                    />
                    {b}
                  </label>
                </li>
              ))}
            </Group>

            <Group title="Availability">
              <li>
                <label className="flex cursor-pointer items-center gap-2 py-[3px] text-[13px]">
                  <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="h-3.5 w-3.5 accent-sma-navy-light" />
                  In stock only
                </label>
              </li>
              <li>
                <label className="flex cursor-pointer items-center gap-2 py-[3px] text-[13px]">
                  <input type="checkbox" checked={hideRestricted} onChange={(e) => setHideRestricted(e.target.checked)} className="h-3.5 w-3.5 accent-sma-navy-light" />
                  Hide age-restricted
                </label>
              </li>
            </Group>
          </aside>

          <div className="min-w-0 flex-1">
            {results.length === 0 ? (
              <div className="rounded-md border border-sma-border p-10 text-center">
                <p className="text-lg font-bold">Nothing matches those filters</p>
                <p className="mt-1 text-sm text-sma-muted">Try clearing a filter or browsing another department.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {results.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="mb-1 text-[15px] font-bold">{title}</h2>
      <ul>{children}</ul>
    </div>
  );
}
