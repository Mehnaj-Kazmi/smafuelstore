import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetail from "@/components/ProductDetail";
import { getProduct, products, relatedProducts } from "@/lib/catalog";

type Params = Promise<{ id: string }>;

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return { title: "Product not found" };
  return { title: product.title, description: product.description.slice(0, 155) };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();
  return <ProductDetail product={product} related={relatedProducts(product)} />;
}
