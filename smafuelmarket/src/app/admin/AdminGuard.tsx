"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

/** Blocks the admin dashboard behind an ADMIN-role session. */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && user?.role !== "ADMIN") router.replace("/signin");
  }, [hydrated, user, router]);

  if (!hydrated || user?.role !== "ADMIN") {
    return <div className="mx-auto max-w-[1500px] px-3 py-10 text-sm text-sma-muted">Checking access…</div>;
  }

  return <>{children}</>;
}
