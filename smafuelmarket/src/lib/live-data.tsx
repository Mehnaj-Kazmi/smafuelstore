"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { departments as seedDepartments, products as seedProducts, type Department, type Product } from "./catalog";
import { deals as seedDeals, type Deal } from "./deals";
import { stores as seedStores, type StoreLocation } from "./store-location";
import { getCatalogProducts } from "./catalog-source";
import { getDeals } from "./deals-source";
import { getStores } from "./store-source";
import { getDepartments } from "./departments-source";
import { getHeroSlides, getShowcaseCards, type HeroSlide, type ShowcaseCardContent } from "./home-content";
import { CatalogProvider } from "./catalog-context";
import { DealsProvider } from "./deals-context";
import { StoreProvider } from "./store-context";

/**
 * Everything the storefront reads out of the shop's database.
 *
 * This used to be fetched on the server while a page was being rendered. The site
 * is now built as static files — the host runs no Node — so there is no server at
 * request time to do that, and data baked in at build would freeze the catalogue:
 * a price changed in the admin panel would keep showing the old one until somebody
 * rebuilt and re-uploaded the site.
 *
 * So it is fetched from the browser instead, once, and shared with every page and
 * component through the providers below. An admin edit reaches customers on their
 * next page load, exactly as it did before.
 */
type LiveData = {
  products: Product[];
  deals: Deal[];
  stores: StoreLocation[];
  departments: Department[];
  heroSlides: HeroSlide[];
  showcaseCards: ShowcaseCardContent[];
  /** False until the first fetch settles, so pages can show a loading state. */
  ready: boolean;
};

/*
 * Seeded with the catalogue the site shipped with rather than empty lists.
 *
 * The first paint happens before the fetch returns, and an empty shop reads as a
 * broken one. Showing the seed data means the page is complete from the first
 * frame and simply sharpens into the live figures a moment later — and if the API
 * is unreachable altogether, a customer still sees a shop rather than a blank page.
 */
const FALLBACK: LiveData = {
  products: seedProducts,
  deals: seedDeals,
  stores: seedStores,
  departments: seedDepartments,
  heroSlides: [],
  showcaseCards: [],
  ready: false,
};

const LiveDataContext = createContext<LiveData>(FALLBACK);

export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<LiveData>(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      /* All six at once: they are independent, and waiting for them in sequence
         would show the seed catalogue for six round trips instead of one. */
      const [products, deals, stores, departments, heroSlides, showcaseCards] = await Promise.all([
        getCatalogProducts(),
        getDeals(),
        getStores(),
        getDepartments(),
        getHeroSlides(),
        getShowcaseCards(),
      ]);

      /* Ignored if the component has gone: setting state on an unmounted tree is
         wasted work and, during navigation, can overwrite fresher data. */
      if (cancelled) return;

      setData({ products, deals, stores, departments, heroSlides, showcaseCards, ready: true });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <LiveDataContext.Provider value={data}>
      <StoreProvider stores={data.stores}>
        <CatalogProvider products={data.products}>
          <DealsProvider deals={data.deals}>{children}</DealsProvider>
        </CatalogProvider>
      </StoreProvider>
    </LiveDataContext.Provider>
  );
}

export function useLiveData(): LiveData {
  return useContext(LiveDataContext);
}

export function useDepartments(): Department[] {
  return useLiveData().departments;
}

export function useHeroSlides(): HeroSlide[] {
  return useLiveData().heroSlides;
}

export function useShowcaseCards(): ShowcaseCardContent[] {
  return useLiveData().showcaseCards;
}
