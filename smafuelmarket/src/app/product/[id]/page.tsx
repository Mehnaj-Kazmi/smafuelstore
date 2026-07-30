import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetail from "@/components/ProductDetail";
import { getProduct, products as seedProducts, relatedProducts } from "@/lib/catalog";
import { getCatalogProducts } from "@/lib/catalog-source";

type Params = Promise<{ id: string }>;

/**
 * Prerender the seed catalogue's ids at build time. Products added later in the
 * admin panel are not in this list, so they render on demand instead — hence
 * `dynamicParams`, without which a newly created product would 404.
 */
export const dynamicParams = true;

export function generateStaticParams() {
  return seedProducts.map((p) => ({ id: String(p.id) }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const catalog = await getCatalogProducts();
  const product = getProduct(Number(id), catalog);
  if (!product) return { title: "Product not found" };
  return { title: product.title, description: product.description.slice(0, 155) };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const catalog = await getCatalogProducts();
  const product = getProduct(Number(id), catalog);
  if (!product) notFound();
  return <ProductDetail product={product} related={relatedProducts(product, 6, catalog)} />;
}
