"use client";

import { useEffect, useState } from "react";
import ProductDetail from "@/components/ProductDetail";
import { getProduct, relatedProducts } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import { useLiveData } from "@/lib/live-data";
import { FALLBACK_PARAM as FALLBACK_ID } from "@/lib/fallback-route";

/** The id in the address bar, for the shell page that has none of its own. */
function idFromPath(): string | null {
  if (typeof window === "undefined") return null;
  const segments = window.location.pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  return last && last !== FALLBACK_ID ? last : null;
}

export default function ProductPageClient({ id: routeId }: { id: string }) {
  const { products } = useCatalog();
  const { ready } = useLiveData();

  /*
   * Starts as whatever the page was exported for, which keeps the first client
   * render identical to the HTML that was served and so hydrates cleanly. Only
   * the shell page has to look at the URL, and it is holding nothing meanwhile.
   */
  const [id, setId] = useState(routeId);

  useEffect(() => {
    if (routeId !== FALLBACK_ID) return;
    const fromPath = idFromPath();
    if (fromPath) setId(fromPath);
  }, [routeId]);

  const resolving = id === FALLBACK_ID;
  const product = resolving ? undefined : getProduct(Number(id), products);

  if (!product) {
    /*
     * "Not found" is only true once the catalogue has actually arrived. Saying it
     * while the fetch is still in flight would flash a 404 on every product the
     * seed list does not happen to contain — which, after a rebuild, is every
     * product the admin has added since.
     */
    return (
      <div className="mx-auto max-w-[1500px] px-4 py-20 text-center">
        {ready && !resolving ? (
          <>
            <h1 className="text-2xl font-extrabold text-white">Product not found</h1>
            <p className="mt-2 text-sm text-ink-faint">This item may have been removed from the shop.</p>
          </>
        ) : (
          <p className="text-sm text-ink-faint">Loading…</p>
        )}
      </div>
    );
  }

  return <ProductDetail product={product} related={relatedProducts(product, 6, products)} />;
}
