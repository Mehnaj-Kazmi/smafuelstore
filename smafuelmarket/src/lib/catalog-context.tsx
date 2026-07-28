"use client";

import { createContext, useContext, useMemo } from "react";
import { products as seedProducts, type Product } from "./catalog";

type CatalogValue = {
  products: Product[];
  getProduct: (id: string) => Product | undefined;
};

/*
 * Defaults to the seed catalogue rather than an empty list. A client component
 * rendered outside the provider then still resolves products instead of showing
 * an empty cart, which fails far more quietly than it should.
 */
const CatalogContext = createContext<Product[]>(seedProducts);

/**
 * Makes the live catalogue available to client components.
 *
 * The list is fetched once on the server in the root layout and handed down, so
 * the cart, wishlist and add-to-cart controls resolve products from exactly the
 * same data the server-rendered pages used — no second fetch from the browser
 * and no window where the two disagree.
 */
export function CatalogProvider({
  products,
  children,
}: {
  products: Product[];
  children: React.ReactNode;
}) {
  return <CatalogContext.Provider value={products}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogValue {
  const products = useContext(CatalogContext);

  return useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return { products, getProduct: (id: string) => byId.get(id) };
  }, [products]);
}
