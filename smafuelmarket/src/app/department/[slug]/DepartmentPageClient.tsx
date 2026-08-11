"use client";

import { useEffect, useState } from "react";
import ResultsBrowser from "@/components/ResultsBrowser";
import { byDepartment, type DepartmentSlug } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import { useDepartments, useLiveData } from "@/lib/live-data";
import { FALLBACK_PARAM as FALLBACK_SLUG } from "@/lib/fallback-route";

/** The slug in the address bar, for the shell page that has none of its own. */
function slugFromPath(): string | null {
  if (typeof window === "undefined") return null;
  const segments = window.location.pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  return last && last !== FALLBACK_SLUG ? last : null;
}

export default function DepartmentPageClient({ slug: routeSlug }: { slug: string }) {
  const { products } = useCatalog();
  const departments = useDepartments();
  const { ready } = useLiveData();

  const [slug, setSlug] = useState(routeSlug);

  useEffect(() => {
    if (routeSlug !== FALLBACK_SLUG) return;
    const fromPath = slugFromPath();
    if (fromPath) setSlug(fromPath);
  }, [routeSlug]);

  const resolving = slug === FALLBACK_SLUG;
  const dept = resolving ? undefined : departments.find((d) => d.slug === (slug as DepartmentSlug));

  if (!dept) {
    return (
      <div className="mx-auto max-w-[1500px] px-4 py-20 text-center">
        {ready && !resolving ? (
          <h1 className="text-2xl font-extrabold text-white">Department not found</h1>
        ) : (
          <p className="text-sm text-ink-faint">Loading…</p>
        )}
      </div>
    );
  }

  return (
    <>
      {dept.ageRestricted && (
        <div className="border-b border-[#f0d4a3] bg-[#fdf3e3]">
          <div className="mx-auto max-w-[1500px] px-4 py-2.5 text-[13px] text-[#7a4a05]">
            <strong>Age-restricted department.</strong> Everything here requires photo ID at handover. Our driver
            will refuse delivery without it.
          </div>
        </div>
      )}
      <ResultsBrowser
        pool={byDepartment(dept.slug, products)}
        heading={dept.name}
        resultLabel={dept.blurb}
        department={dept.slug}
      />
    </>
  );
}
