import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Your account" };

const tiles = [
  { title: "Your orders", body: "Track deliveries, buy again, report a problem", href: "/orders" },
  { title: "Addresses", body: "Edit where we deliver and set a default", href: "/addresses" },
  { title: "Wishlist", body: "Items you saved for later", href: "/wishlist" },
  { title: "Notifications", body: "Order updates and deals", href: "/notifications" },
  { title: "Settings", body: "Password, contact details, preferences", href: "/settings" },
  { title: "Customer service", body: "FAQs and how to reach us", href: "/faqs" },
];

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6">
      <div className="bg-surface p-5">
        <h1 className="text-2xl font-bold">Your account</h1>
        <p className="mt-1 text-sm text-sma-muted">Manage orders, addresses and preferences.</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="group flex flex-col rounded-lg border border-sma-border bg-surface p-5 hover:border-sma-accent">
            <h2 className="text-base font-bold group-hover:text-sma-link-hover">{t.title}</h2>
            <p className="mt-1 text-[13px] leading-5 text-sma-muted">{t.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
