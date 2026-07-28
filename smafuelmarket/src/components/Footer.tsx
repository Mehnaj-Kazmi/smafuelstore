import Link from "next/link";
import SmaLogo from "./SmaLogo";
import { primaryStore } from "@/lib/store-location";

const columns = [
  {
    heading: "Shop",
    links: [
      { label: "All products", href: "/shop" },
      { label: "Daily deals", href: "/deals" },
      { label: "Departments", href: "/departments" },
      { label: "Hot food", href: "/department/bakery" },
    ],
  },
  {
    heading: "Your account",
    links: [
      { label: "Sign in", href: "/signin" },
      { label: "Your orders", href: "/orders" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Addresses", href: "/addresses" },
    ],
  },
  {
    heading: "About",
    links: [
      { label: "About us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "FAQs", href: "/faqs" },
      { label: "Store locations", href: "/contact" },
    ],
  },
  {
    heading: "Store team",
    links: [
      { label: "Admin dashboard", href: "/admin" },
      { label: "Inventory", href: "/admin/inventory" },
      { label: "Orders", href: "/admin/orders" },
      { label: "Reports", href: "/admin/reports" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-8">
      <a href="#top" className="block bg-sma-navy-hover py-4 text-center text-[13px] text-white transition hover:bg-[#485769]">
        Back to top
      </a>

      <div className="bg-sma-navy-light text-white">
        <div className="mx-auto grid max-w-[1000px] grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="mb-2 text-base font-bold">{col.heading}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[13px] text-gray-300 hover:underline">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/20">
          <div className="mx-auto flex max-w-[1000px] flex-wrap items-center justify-center gap-4 px-6 py-7 text-center">
            <Link href="/" aria-label="SMA Fuel & Market home">
              <SmaLogo className="h-10 w-auto" />
            </Link>
            <span className="rounded-sm border border-white/40 px-3 py-1.5 text-xs">{primaryStore.hours}</span>
            <span className="rounded-sm border border-white/40 px-3 py-1.5 text-xs">
              Delivery within {primaryStore.radiusMiles} miles
            </span>
            <span className="rounded-sm border border-white/40 px-3 py-1.5 text-xs">{primaryStore.phone}</span>
          </div>
        </div>
      </div>

      <div className="bg-sma-navy py-8 text-center text-xs text-gray-400">
        <div className="mx-auto flex max-w-[700px] flex-wrap justify-center gap-x-5 gap-y-2 px-4">
          <Link href="/faqs" className="hover:underline">Conditions of use</Link>
          <Link href="/faqs" className="hover:underline">Privacy notice</Link>
          <Link href="/faqs" className="hover:underline">Age-restricted sales policy</Link>
          <Link href="/contact" className="hover:underline">Contact us</Link>
        </div>
        <p className="mt-3">
          © {new Date().getFullYear()} SMA Fuel &amp; Market. {primaryStore.address}, {primaryStore.city}.
        </p>
        <p className="mt-1">A demonstration storefront — no real orders are fulfilled.</p>
      </div>
    </footer>
  );
}
