import type { Metadata } from "next";
import OrdersAdmin from "./OrdersAdmin";

export const metadata: Metadata = { title: "Orders" };

/** Server shell for metadata; the order table is interactive. */
export default function AdminOrdersPage() {
  return <OrdersAdmin />;
}
