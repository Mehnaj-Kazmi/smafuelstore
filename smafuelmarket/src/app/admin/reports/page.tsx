import type { Metadata } from "next";
import ReportsClient from "./ReportsClient";

export const metadata: Metadata = { title: "Reports" };

/** Server shell for metadata; reports read live orders. */
export default function AdminReportsPage() {
  return <ReportsClient />;
}
