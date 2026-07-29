import type { Metadata } from "next";
import StoreAdmin from "./StoreAdmin";

export const metadata: Metadata = { title: "Store" };

/** Server shell for metadata; the store form is interactive. */
export default function AdminStorePage() {
  return <StoreAdmin />;
}
