"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResultsBrowser from "@/components/ResultsBrowser";
import { searchProducts, type DepartmentSlug, type SortKey } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";

/*
 * Read from the address bar rather than from a server-side `searchParams` prop.
 *
 * The site is built as static files, so there is no server to hand the query
 * string in — and searching has to keep working when the customer edits the URL
 * or arrives from a shared link. `useSearchParams` reads exactly the same values
 * from the browser.
 */
function ShopResults() {
  const params = useSearchParams();
  const { products } = useCatalog();

  const query = params.get("q") ?? "";
  const department = (params.get("department") as DepartmentSlug | null) ?? "all";
  const sort = (params.get("sort") as SortKey | null) ?? "featured";

  const pool = searchProducts(query, { department, sort }, products);

  return (
    <ResultsBrowser
      pool={pool}
      heading={query ? `Results for "${query}"` : "Shop all products"}
      resultLabel={query ? `searched "${query}"` : "everything in store"}
      department={department === "all" ? undefined : department}
      initialSort={sort}
    />
  );
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopResults />
    </Suspense>
  );
}
