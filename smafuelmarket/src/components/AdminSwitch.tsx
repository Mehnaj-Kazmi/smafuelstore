"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

/**
 * Lets a signed-in admin move between the shop and the back office.
 *
 * Rendered only when the session's role is ADMIN, which is why the storefront
 * has no static admin links: advertising the back office to every shopper
 * invites them to go poking at it. Staff get the link because they are already
 * identified, and it flips label depending on which side they are on, so one
 * control covers both directions.
 */
export default function AdminSwitch() {
  const { user, hydrated } = useAuth();
  const pathname = usePathname();

  if (!hydrated || user?.role !== "ADMIN") return null;

  const inAdmin = pathname.startsWith("/admin");

  return (
    <Link
      href={inAdmin ? "/" : "/admin"}
      className="fixed bottom-4 right-4 z-[65] inline-flex items-center gap-2 rounded-full border border-brand-green/50 bg-surface-2/95 px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-wide text-brand-green shadow-2xl backdrop-blur transition hover:border-brand-green hover:bg-brand-green/15"
      title={inAdmin ? "View the shop as a customer" : "Open the admin dashboard"}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        {inAdmin ? (
          <path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 9h18M9 9v11" />
          </>
        )}
      </svg>
      {inAdmin ? "Customer view" : "Admin panel"}
    </Link>
  );
}
