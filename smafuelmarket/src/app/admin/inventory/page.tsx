import type { Metadata } from "next";
import InventoryClient from "./InventoryClient";

export const metadata: Metadata = { title: "Inventory" };

/** Server shell for metadata; stock reads the live catalogue. */
export default function InventoryPage() {
  return <InventoryClient />;
}
