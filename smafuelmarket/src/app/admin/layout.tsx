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
  { label: "Homepage", href: "/admin/homepage" },
  { label: "Store", href: "/admin/store" },
  { label: "Reports", href: "/admin/reports" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="mx-auto max-w-[1500px] px-3 py-4">
        <div className="mb-5 rounded-2xl border border-line bg-surface px-5 py-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold">Store admin</h1>
              <p className="text-xs text-ink-faint">SMA Fuel &amp; Market — Riverside</p>
            </div>
            <Link
              href="/"
              className="rounded-full border border-line px-3.5 py-1.5 text-xs font-bold transition hover:border-brand-green hover:text-brand-green"
            >
              View storefront →
            </Link>
          </div>

          <nav className="mt-4 flex gap-1 overflow-x-auto no-scrollbar">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold text-ink-soft transition hover:bg-surface-2 hover:text-white"
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
