import Link from "next/link";
import type { Metadata } from "next";
import AdminGuard from "./AdminGuard";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | SMA Admin" },
  robots: { index: false, follow: false },
};

const nav = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Inventory", href: "/admin/inventory" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Daily deals", href: "/admin/deals" },
  { label: "Reports", href: "/admin/reports" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="mx-auto max-w-[1500px] px-3 py-4">
        <div className="mb-4 rounded-lg bg-sma-navy px-5 py-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">Store admin</h1>
              <p className="text-xs text-gray-300">SMA Fuel &amp; Market — Riverside</p>
            </div>
            <Link href="/" className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25">
              View storefront →
            </Link>
          </div>

          <nav className="mt-3 flex gap-1 overflow-x-auto no-scrollbar">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] hover:bg-white/15"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        {children}
      </div>
    </AdminGuard>
  );
}
