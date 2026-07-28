import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ResultsBrowser from "@/components/ResultsBrowser";
import { byDepartment, departments, departmentMap, type DepartmentSlug } from "@/lib/catalog";
import { getCatalogProducts } from "@/lib/catalog-source";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return departments.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const dept = departmentMap[slug as DepartmentSlug];
  if (!dept) return { title: "Department not found" };
  return { title: dept.name, description: dept.blurb };
}

export default async function DepartmentPage({ params }: { params: Params }) {
  const { slug } = await params;
  const dept = departmentMap[slug as DepartmentSlug];
  if (!dept) notFound();

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
        pool={byDepartment(dept.slug, await getCatalogProducts())}
        heading={dept.name}
        resultLabel={dept.blurb}
        department={dept.slug}
      />
    </>
  );
}
