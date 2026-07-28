import type { Metadata } from "next";
import DealsAdmin from "./DealsAdmin";

export const metadata: Metadata = { title: "Daily deals" };

/**
 * Server shell so the route can still export metadata — the promotions table
 * itself is interactive and lives in the client component.
 */
export default function AdminDealsPage() {
  return <DealsAdmin />;
}
