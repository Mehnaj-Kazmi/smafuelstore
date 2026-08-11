import type { Metadata } from "next";

/* Held here because the page itself is a client component now — it reads the
   live promotions from the browser — and those cannot export `metadata`. */
export const metadata: Metadata = {
  title: "Daily Deals",
  description: "Flash sales, buy-one-get-one offers and weekend deals at SMA Fuel & Market.",
};

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
