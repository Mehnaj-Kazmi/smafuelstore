import type { Metadata } from "next";

/* Held here because the page reads the live departments from the browser, and a
   client component cannot export `metadata`. */
export const metadata: Metadata = {
  title: "Departments",
  description: "Browse every department at SMA Fuel & Market.",
};

export default function DepartmentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
