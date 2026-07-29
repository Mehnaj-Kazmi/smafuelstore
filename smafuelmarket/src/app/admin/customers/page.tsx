import type { Metadata } from "next";
import CustomersClient from "./CustomersClient";

export const metadata: Metadata = { title: "Customers" };

/** Server shell for metadata; customer figures come from live orders. */
export default function AdminCustomersPage() {
  return <CustomersClient />;
}
