"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { departments } from "@/lib/catalog";
import { primaryStore } from "@/lib/store-location";
import SmaLogo from "./SmaLogo";
import CartCount from "./CartCount";

const navLinks = [
  { label: "Shop All", href: "/shop" },
  { label: "Daily Deals", href: "/deals" },
  { label: "Departments", href: "/departments" },
  { label: "Hot Food", href: "/department/bakery" },
  { label: "Drinks", href: "/department/drinks" },
  { label: "Automotive", href: "/department/automotive" },
  { label: "Help", href: "/faqs" },
];

export default function Header() {
  const router = useRouter();
  const params = useSearchParams();

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setQuery(params.get("q") ?? "");
  }, [params]);

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
      <div className="bg-sma-navy text-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-1 px-2 py-1.5 sm:gap-2">
          <Link
            href="/"
            className="shrink-0 rounded-sm border border-transparent px-2 py-1.5 hover:border-white"
            aria-label="SMA Fuel & Market home"
          >
            <SmaLogo className="h-9 w-auto" />
          </Link>

          <Link
            href="/contact"
            className="hidden shrink-0 items-center gap-1 rounded-sm border border-transparent px-2 py-1.5 hover:border-white lg:flex"
          >
            <PinIcon />
            <span className="leading-tight">
              <span className="block text-[11px] text-gray-300">Delivering from</span>
              <span className="block text-[13px] font-bold">{primaryStore.city}</span>
            </span>
          </Link>

          <form onSubmit={submitSearch} className="flex min-w-0 flex-1 items-stretch" role="search">
            <label htmlFor="scope" className="sr-only">Search department</label>
            <select
              id="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="hidden w-[52px] shrink-0 cursor-pointer appearance-none rounded-l-md border-r border-gray-300 bg-[#e6e6e6] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2010%206%22%3E%3Cpath%20d%3D%22M0%200h10L5%206z%22%20fill%3D%22%23555%22/%3E%3C/svg%3E')] bg-[length:8px] bg-[position:right_6px_center] bg-no-repeat pl-2 pr-4 text-[12px] text-gray-800 outline-none sm:block"
            >
              <option value="all">All</option>
              {departments.map((d) => (
                <option key={d.slug} value={d.slug}>{d.name}</option>
              ))}
            </select>
            <label htmlFor="q" className="sr-only">Search the store</label>
            <input
              id="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search snacks, drinks, oil…"
              className="w-full min-w-0 rounded-l-md bg-white px-3 py-2 text-sm text-black outline-none sm:rounded-none"
            />
            <button type="submit" aria-label="Search" className="shrink-0 rounded-r-md bg-sma-accent-soft px-3 text-black transition-colors hover:bg-sma-accent">
              <SearchIcon />
            </button>
          </form>

          <Link href="/signin" className="hidden shrink-0 rounded-sm border border-transparent px-2 py-1.5 leading-tight hover:border-white md:block">
            <span className="block text-[11px]">Hello, sign in</span>
            <span className="block text-[13px] font-bold">Account</span>
          </Link>

          <Link href="/orders" className="hidden shrink-0 rounded-sm border border-transparent px-2 py-1.5 leading-tight hover:border-white md:block">
            <span className="block text-[11px]">Returns</span>
            <span className="block text-[13px] font-bold">&amp; Orders</span>
          </Link>

          <CartCount>
            {(count) => (
              <Link
                href="/cart"
                className="flex shrink-0 items-end gap-1 rounded-sm border border-transparent px-2 py-1.5 hover:border-white"
                aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
              >
                <span className="relative">
                  <CartIcon />
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[15px] font-bold text-sma-accent">
                    {count}
                  </span>
                </span>
                <span className="hidden text-[13px] font-bold sm:inline">Cart</span>
              </Link>
            )}
          </CartCount>
        </div>
      </div>

      <div className="bg-sma-navy-light text-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-2 py-1 text-[13px] no-scrollbar">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-sm border border-transparent px-2 py-1 font-bold hover:border-white"
          >
            <BurgerIcon /> All
          </button>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="shrink-0 whitespace-nowrap rounded-sm border border-transparent px-2 py-1 hover:border-white">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-black/60" />
          <nav className="absolute inset-y-0 left-0 flex w-[86%] max-w-[365px] flex-col overflow-y-auto bg-white">
            <div className="flex items-center gap-3 bg-sma-navy-light px-6 py-3 text-white">
              <UserIcon />
              <span className="text-lg font-bold">Hello, sign in</span>
            </div>
            <div className="px-2 py-3">
              <p className="px-4 pb-1 pt-2 text-lg font-bold">Shop by department</p>
              {departments.map((d) => (
                <Link key={d.slug} href={`/department/${d.slug}`} onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-gray-100">
                  {d.name}
                </Link>
              ))}
              <hr className="my-2 border-gray-200" />
              <p className="px-4 pb-1 pt-2 text-lg font-bold">Your account</p>
              {[
                { label: "Your orders", href: "/orders" },
                { label: "Wishlist", href: "/wishlist" },
                { label: "Addresses", href: "/addresses" },
                { label: "Notifications", href: "/notifications" },
                { label: "Settings", href: "/settings" },
                { label: "Admin dashboard", href: "/admin" },
              ].map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-gray-100">
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
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
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
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-9 2-9 5v1h18v-1c0-3-5-5-9-5Z" />
    </svg>
  );
}
