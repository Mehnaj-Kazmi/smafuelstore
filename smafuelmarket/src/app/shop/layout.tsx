import type { Metadata } from "next";

/*
 * The page itself is a client component now — it reads the search query from the
 * address bar — and a client component cannot export `metadata`. Keeping the
 * title here means the browser tab and shared links still read "Shop all".
 */
export const metadata: Metadata = { title: "Shop all" };

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
