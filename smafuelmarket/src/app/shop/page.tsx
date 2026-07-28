import { Suspense } from "react";
import type { Metadata } from "next";
import ResultsBrowser from "@/components/ResultsBrowser";
import { searchProducts, type DepartmentSlug, type SortKey } from "@/lib/catalog";
import { getCatalogProducts } from "@/lib/catalog-source";

export const metadata: Metadata = { title: "Shop all" };

type SearchParams = Promise<{ q?: string; department?: string; sort?: string }>;

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = params.q ?? "";
  const department = (params.department as DepartmentSlug | undefined) ?? "all";
  const sort = (params.sort as SortKey | undefined) ?? "featured";

  const pool = searchProducts(query, { department, sort }, await getCatalogProducts());

  return (
    <Suspense>
      <ResultsBrowser
        pool={pool}
        heading={query ? `Results for "${query}"` : "Shop all products"}
        resultLabel={query ? `searched "${query}"` : "everything in store"}
        department={department === "all" ? undefined : department}
        initialSort={sort}
      />
    </Suspense>
  );
}
