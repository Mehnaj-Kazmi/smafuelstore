import { products as seedProducts } from "@/lib/catalog";
import { liveProductIds } from "@/lib/build-params";
import { FALLBACK_PARAM } from "@/lib/fallback-route";
import ProductPageClient from "./ProductPageClient";

/**
 * One product page.
 *
 * The site ships as static files, so this route is prerendered once per product
 * in the seed catalogue. A product added in the admin panel afterwards has no
 * file of its own — the server rewrites any unknown `/product/<id>` onto one of
 * these, which works because every one of them is the same shell: the id comes
 * from the URL and the product is looked up in the catalogue the browser fetches
 * at runtime.
 *
 * This file stays a server component only because `generateStaticParams` cannot
 * live in a client one; all the actual rendering happens in ProductPageClient.
 */
export async function generateStaticParams() {
  const ids = await liveProductIds(seedProducts.map((p) => p.id));

  /* Plus the shell the server hands to any product added since this build. */
  return [...ids.map((id) => ({ id: String(id) })), { id: FALLBACK_PARAM }];
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductPageClient id={id} />;
}
