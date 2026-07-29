"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { departments } from "@/lib/catalog";
import { usePrimaryStore } from "@/lib/store-context";
import SmaLogo from "./SmaLogo";
import CartCount from "./CartCount";
import WishCount from "./WishCount";

const navLinks = [
  { label: "Food", href: "/department/bakery" },
  { label: "Drinks", href: "/department/drinks" },
  { label: "Deals", href: "/deals" },
  { label: "Departments", href: "/departments" },
  { label: "Automotive", href: "/department/automotive" },
  { label: "Shop All", href: "/shop" },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const primaryStore = usePrimaryStore();

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /*
   * The search box is prefilled from the URL by reading location directly
   * rather than with useSearchParams().
   *
   * useSearchParams() opts its whole subtree out of static prerendering, which
   * forced the entire header into a Suspense boundary that Next defers on every
   * statically generated page. That boundary hydrates separately and at lower
   * priority than the main tree, so the header could sit un-hydrated — dead
   * burger menu, dead search, and cart and wishlist badges frozen at zero —
   * on the home page and every product page, while working fine on the one
   * dynamic route. Reading location after mount keeps the header in the main
   * hydration pass on every route.
   */
  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
  }, [pathname]);

  /* Solid black at rest, blurred and hairlined once the page moves. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const search = new URLSearchParams();
    if (query.trim()) search.set("q", query.trim());
    if (scope !== "all") search.set("department", scope);
    router.push(`/shop?${search.toString()}`);
  }

  return (
    <header className="sticky top-0 z-40">
      <div
        className={`transition-colors duration-300 ${
          scrolled
            ? "border-b border-line bg-black/85 backdrop-blur-xl"
            : "border-b border-transparent bg-black"
        }`}
      >
        <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-3 py-3 lg:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="-ml-1 shrink-0 rounded-full p-2 text-white transition hover:bg-white/10 lg:hidden"
          >
            <BurgerIcon />
          </button>

          <Link
            href="/"
            className="shrink-0 rounded-md px-1 py-1 transition-transform duration-300 hover:scale-[1.04]"
            aria-label="SMA Fuel & Market home"
          >
            <SmaLogo className="h-9 w-auto" />
          </Link>

          <nav className="ml-4 hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="link-draw whitespace-nowrap text-[15px] font-bold tracking-tight text-white transition-colors hover:text-brand-green"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {/* Search grows when focused, so it stays out of the way at rest. */}
            <form
              onSubmit={submitSearch}
              role="search"
              className={`flex items-stretch overflow-hidden rounded-full border bg-surface transition-[width,border-color] duration-300 ${
                searchFocused
                  ? "w-[min(56vw,400px)] border-brand-green"
                  : "w-[42px] border-line sm:w-[210px] lg:w-[240px]"
              }`}
            >
              <label htmlFor="q" className="sr-only">
                Search the store
              </label>
              <input
                id="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search snacks, drinks, oil…"
                className={`min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-ink-faint ${
                  searchFocused ? "" : "hidden sm:block"
                }`}
              />
              <label htmlFor="scope" className="sr-only">
                Search department
              </label>
              <select
                id="scope"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className={`w-[46px] shrink-0 cursor-pointer appearance-none border-l border-line bg-transparent bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2010%206%22%3E%3Cpath%20d%3D%22M0%200h10L5%206z%22%20fill%3D%22%23b8b8c0%22/%3E%3C/svg%3E')] bg-[length:8px] bg-[position:right_8px_center] bg-no-repeat pl-2 text-[12px] text-ink-soft outline-none ${
                  searchFocused ? "block" : "hidden lg:block"
                }`}
              >
                <option value="all">All</option>
                {departments.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                aria-label="Search"
                className="shrink-0 px-3 text-white transition-colors hover:text-brand-green"
              >
                <SearchIcon />
              </button>
            </form>

            <Link
              href="/contact"
              className="hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-white transition hover:bg-white/10 xl:flex"
            >
              <span className="text-brand-green">
                <PinIcon />
              </span>
              <span className="link-draw text-[13px] font-bold">{primaryStore.city}</span>
            </Link>

            <Link
              href="/signin"
              aria-label="Your account"
              className="shrink-0 rounded-full p-2 text-white transition hover:bg-white/10"
            >
              <UserIcon />
            </Link>

            {/* Saved items need a permanent home in the chrome — without it a
                heart click has nowhere to lead back to. */}
            <WishCount>
              {(count) => (
                <Link
                  href="/wishlist"
                  className="relative shrink-0 rounded-full p-2 text-white transition hover:bg-white/10"
                  aria-label={`Saved items, ${count} ${count === 1 ? "item" : "items"}`}
                >
                  <HeartIcon filled={count > 0} />
                  {count > 0 && (
                    <span className="absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-sma-deal px-1 text-[11px] font-extrabold text-white">
                      {count}
                    </span>
                  )}
                </Link>
              )}
            </WishCount>

            <Link
              href="/orders"
              aria-label="Your orders"
              className="hidden shrink-0 rounded-full p-2 text-white transition hover:bg-white/10 md:block"
            >
              <BoxIcon />
            </Link>

            <CartCount>
              {(count) => (
                <Link
                  href="/cart"
                  className="relative shrink-0 rounded-full p-2 text-white transition hover:bg-white/10"
                  aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
                >
                  <CartIcon />
                  {count > 0 && (
                    <span className="pulse-ring absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-green px-1 text-[11px] font-extrabold text-black">
                      {count}
                    </span>
                  )}
                </Link>
              )}
            </CartCount>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="anim-fade absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <nav className="anim-rise absolute inset-y-0 left-0 flex w-[86%] max-w-[365px] flex-col overflow-y-auto border-r border-line bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4 text-white">
              <span className="flex items-center gap-3">
                <UserIcon />
                <span className="text-lg font-bold">Hello, sign in</span>
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-full p-1.5 transition hover:bg-white/10"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="px-2 py-3">
              <p className="eyebrow px-4 pb-2 pt-2">Shop by department</p>
              {departments.map((d) => (
                <Link
                  key={d.slug}
                  href={`/department/${d.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:bg-surface-2"
                >
                  {d.name}
                </Link>
              ))}
              <hr className="my-3 border-line" />
              <p className="eyebrow px-4 pb-2 pt-2">Your account</p>
              {[
                { label: "Your orders", href: "/orders" },
                { label: "Wishlist", href: "/wishlist" },
                { label: "Addresses", href: "/addresses" },
                { label: "Notifications", href: "/notifications" },
                { label: "Settings", href: "/settings" },
                /* No admin link here either — this menu is the customer's
                   account area, and staff reach /admin by signing in. */
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:bg-surface-2"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M7 18a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 18Zm10 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 17 18ZM2.2 3a1 1 0 0 0 0 2h1.6l2.6 9.6A2.6 2.6 0 0 0 9 16.5h8.6a1 1 0 0 0 0-2H9a.6.6 0 0 1-.6-.45L8.2 13h9.9a2 2 0 0 0 1.94-1.5l1.5-5.5A1 1 0 0 0 20.6 4.7H6.3l-.4-1.5A1 1 0 0 0 4.9 3H2.2Z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.2 6.2 12.3 6.5 12.6a.7.7 0 0 0 1 0C12.8 21.3 19 14.2 19 9a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5Z" />
    </svg>
  );
}

function BurgerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 transition-colors"
      fill={filled ? "#ee1c25" : "none"}
      stroke={filled ? "#ee1c25" : "currentColor"}
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <path d="M12 20.3 4.6 13a4.8 4.8 0 0 1 6.8-6.8l.6.6.6-.6A4.8 4.8 0 1 1 19.4 13z" strokeLinejoin="round" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5v-7Z" strokeLinejoin="round" />
      <path d="m3 8.5 9 4.5 9-4.5M12 13v7" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <circle cx="12" cy="8.5" r="4" />
      <path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6" strokeLinecap="round" />
    </svg>
  );
}
