import type { ArtKey } from "./catalog";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type HeroSlide = {
  id: number;
  eyebrow: string;
  title: string;
  blurb: string;
  badgeBig: string;
  badgeSmall: string;
  ctaLabel: string;
  ctaHref: string;
  accent: string;
  /** Uploaded artwork per tile; a blank entry falls back to `fallbackArt`. */
  tileImages: string[];
  fallbackArt: string[];
};

export type ShowcaseTile = {
  label: string;
  href: string;
  imageUrl?: string | null;
  art: ArtKey;
  hue: number;
};

export type ShowcaseCardContent = {
  id: number;
  title: string;
  linkLabel: string;
  linkHref: string;
  variant: "grid" | "single";
  tiles: ShowcaseTile[];
};

/*
 * Fallbacks used when the API cannot be reached.
 *
 * These are the slides and cards the page shipped with before any of it was
 * editable. Keeping them means a storefront with the API down still renders a
 * complete home page rather than a hero with no slides and an empty grid.
 */
const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: 0,
    eyebrow: "Open 24 hours · Delivered in 30 minutes",
    title: "The whole store,\nbrought to your door",
    blurb:
      "Snacks, drinks, hot food and everything else on the shelf. Ordered now, on your doorstep in about half an hour.",
    badgeBig: "30",
    badgeSmall: "MINUTE DELIVERY",
    ctaLabel: "Start shopping",
    ctaHref: "/shop",
    accent: "#00b04f",
    tileImages: [],
    fallbackArt: ["coffee", "donut", "soda", "chips"],
  },
];

const FALLBACK_CARDS: ShowcaseCardContent[] = [
  {
    id: 0,
    title: "Breakfast, served early",
    linkLabel: "Shop the bakery",
    linkHref: "/department/bakery",
    variant: "grid",
    tiles: [
      { label: "Fresh coffee", href: "/department/bakery", art: "coffee", hue: 25 },
      { label: "Donuts & muffins", href: "/department/bakery", art: "donut", hue: 25 },
      { label: "Breakfast sandwiches", href: "/department/bakery", art: "sandwich", hue: 40 },
      { label: "Juice & milk", href: "/department/drinks", art: "juice", hue: 35 },
    ],
  },
];

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return fallback;
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) return fallback;
    return data as T;
  } catch {
    return fallback;
  }
}

export function getHeroSlides(): Promise<HeroSlide[]> {
  return fetchJson<HeroSlide[]>("/home/hero-slides", FALLBACK_SLIDES);
}

export function getShowcaseCards(): Promise<ShowcaseCardContent[]> {
  return fetchJson<ShowcaseCardContent[]>("/home/showcase-cards", FALLBACK_CARDS);
}
