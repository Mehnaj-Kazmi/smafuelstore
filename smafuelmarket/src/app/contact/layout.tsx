import type { Metadata } from "next";

/* Held here because the page reads the live store locations from the browser,
   and a client component cannot export `metadata`. */
export const metadata: Metadata = {
  title: "Contact & locations",
  description: "Store address, opening hours, phone number and delivery area.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
