import {
  products as seedProducts,
  type ArtKey,
  type DepartmentSlug,
  type Product,
} from "./catalog";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

/** The catalogue as the API returns it, before mapping to the storefront shape. */
type ApiProduct = {
  id: string;
  sku: string;
  barcode: string;
  title: string;
  brand: string;
  departmentSlug: string;
  categorySlug: string;
  unit: string;
  /** Prisma serialises Decimal as a string, so this arrives as "8.49". */
  price: string | number;
  listPrice: string | number | null;
  stock: number;
  lowStockAt: number;
  rating: number;
  reviews: number;
  imageUrl: string | null;
  art: string;
  hue: number;
  ageRestricted: boolean;
  tags: string[];
  bullets: string[];
  description: string;
};

function num(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function toProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    title: p.title,
    brand: p.brand,
    /* The API names these `*Slug`; the storefront type uses the bare names. */
    department: p.departmentSlug as DepartmentSlug,
    category: p.categorySlug,
    unit: p.unit,
    price: num(p.price) ?? 0,
    listPrice: num(p.listPrice),
    stock: p.stock,
    lowStockAt: p.lowStockAt,
    rating: p.rating,
    reviews: p.reviews,
    imageUrl: p.imageUrl,
    art: p.art as ArtKey,
    hue: p.hue,
    ageRestricted: p.ageRestricted,
    tags: p.tags ?? [],
    bullets: p.bullets ?? [],
    description: p.description,
  };
}

/**
 * The product catalogue the storefront renders.
 *
 * Fetched from the API so anything changed in the admin panel — a new product,
 * an edited price, an uploaded photograph — is what customers see.
 *
 * `no-store` is deliberate: a cached catalogue is the reason an admin edit can
 * appear to do nothing, and this data is small enough that re-fetching costs
 * little next to that confusion.
 *
 * If the API is unreachable the seed catalogue is returned instead, so the
 * storefront still renders a full shop rather than an empty one. An empty
 * response is treated the same way — an API that answers with zero products is
 * far more likely to be mid-setup than to be a genuinely empty shop.
 */
export async function getCatalogProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/products`, { cache: "no-store" });
    if (!res.ok) return seedProducts;

    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) return seedProducts;

    return (data as ApiProduct[]).map(toProduct);
  } catch {
    return seedProducts;
  }
}

/** A single product, or undefined when the id is unknown. */
export async function getCatalogProduct(id: string): Promise<Product | undefined> {
  const list = await getCatalogProducts();
  return list.find((p) => p.id === id);
}
