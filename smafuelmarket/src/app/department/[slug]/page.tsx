import { departments as seedDepartments } from "@/lib/catalog";
import { liveDepartmentSlugs } from "@/lib/build-params";
import { FALLBACK_PARAM } from "@/lib/fallback-route";
import DepartmentPageClient from "./DepartmentPageClient";

/*
 * Prerendered once per department. The list rarely changes, but the page reads
 * the live departments at runtime all the same, so one renamed or re-photographed
 * in the admin panel shows the new version without a rebuild.
 *
 * A server component only because `generateStaticParams` cannot live in a client
 * one; the rendering is all in DepartmentPageClient.
 */
export async function generateStaticParams() {
  const slugs = await liveDepartmentSlugs(seedDepartments.map((d) => d.slug));

  /* Plus the shell the server hands to any department added since this build. */
  return [...slugs.map((slug) => ({ slug })), { slug: FALLBACK_PARAM }];
}

export default async function DepartmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DepartmentPageClient slug={slug} />;
}
