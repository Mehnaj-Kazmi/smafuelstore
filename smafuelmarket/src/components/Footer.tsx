import Link from "next/link";
import SmaLogo from "./SmaLogo";
import { getPrimaryStore } from "@/lib/store-source";

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
];

/*
 * There is deliberately no "Store team" column here.
 *
 * The footer linked straight to the admin dashboard, inventory, orders and
 * reports, which advertised the back office to every customer. The routes are
 * guarded, so nothing was exposed — but telling shoppers where the admin lives
 * invites them to go poking at it, and it makes the shop look unfinished.
 *
 * Staff are not locked out: signing in with an ADMIN account lands on /admin
 * automatically (see the sign-in page), and the address can be bookmarked.
 */

export default async function Footer() {
  const primaryStore = await getPrimaryStore();

  return (
    <footer className="mt-14 border-t border-line bg-black">
      <a
        href="#top"
        className="group block border-b border-line py-4 text-center text-[13px] font-bold text-ink-soft transition hover:text-white"
      >
        <span className="inline-flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            aria-hidden="true"
          >
            <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to top
        </span>
      </a>

      <div className="mx-auto grid max-w-[820px] grid-cols-2 justify-items-center gap-8 px-6 py-14 text-center sm:grid-cols-3">
        {columns.map((col) => (
          <div key={col.heading}>
            <h3 className="eyebrow mb-3">{col.heading}</h3>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="link-draw text-[13px] font-medium text-ink-soft transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-center gap-3 px-6 py-8 text-center">
          <Link href="/" aria-label="SMA Fuel & Market home" className="mr-2 transition-transform hover:scale-105">
            <SmaLogo className="h-10 w-auto" />
          </Link>
          {[
            primaryStore.hours,
            `Delivery within ${primaryStore.radiusMiles} miles`,
            primaryStore.phone,
          ].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-line px-4 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-brand-green hover:text-white"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-line py-8 text-center text-xs text-ink-faint">
        <div className="mx-auto flex max-w-[700px] flex-wrap justify-center gap-x-5 gap-y-2 px-4">
          <Link href="/faqs" className="transition-colors hover:text-white">Conditions of use</Link>
          <Link href="/faqs" className="transition-colors hover:text-white">Privacy notice</Link>
          <Link href="/faqs" className="transition-colors hover:text-white">Age-restricted sales policy</Link>
          <Link href="/contact" className="transition-colors hover:text-white">Contact us</Link>
        </div>
        <p className="mt-4">
          © {new Date().getFullYear()} SMA Fuel &amp; Market. {primaryStore.address}, {primaryStore.city}.
        </p>
        <p className="mt-1">A demonstration storefront — no real orders are fulfilled.</p>
      </div>
    </footer>
  );
}
