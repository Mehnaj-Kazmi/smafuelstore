"use client";

import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import { byDepartment, categoriesIn } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import { useDepartments } from "@/lib/live-data";

export default function DepartmentsPage() {
  const departments = useDepartments();
  const { products } = useCatalog();

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4">
      <div className="bg-surface p-5">
        <h1 className="text-2xl font-bold">Departments</h1>
        <p className="mt-1 text-sm text-sma-muted">
          Nine departments, {departments.reduce((n, d) => n + byDepartment(d.slug, products).length, 0)} products in stock.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => {
          const count = byDepartment(d.slug, products).length;
          const cats = categoriesIn(d.slug);
          return (
            <section key={d.slug} className="flex gap-4 bg-surface p-5">
              <Link href={`/department/${d.slug}`} className="shrink-0">
                <ProductImage
                  imageUrl={d.imageUrl}
                  art={d.art}
                  hue={d.hue}
                  alt={d.name}
                  className="h-24 w-24 rounded-md"
                />
              </Link>
              <div className="min-w-0">
                <h2 className="text-lg font-bold">
                  <Link href={`/department/${d.slug}`} className="hover:text-sma-link-hover">{d.name}</Link>
                </h2>
                <p className="text-[13px] text-sma-muted">{d.blurb}</p>
                {d.ageRestricted && (
                  <p className="mt-1 text-xs font-medium text-[#7a4a05]">ID required — 21+</p>
                )}
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {cats.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/department/${d.slug}`} className="text-[13px] text-sma-link hover:text-sma-link-hover hover:underline">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-sma-muted">{count} products</p>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
