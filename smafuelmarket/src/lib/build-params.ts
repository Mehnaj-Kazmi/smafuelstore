/**
 * The ids and slugs to prerender a page for, read from the live shop at build time.
 *
 * `generateStaticParams` runs on the build machine, not in the browser, so it
 * needs an address it can actually reach — `NEXT_PUBLIC_API_URL` is a relative
 * `/api` in production, which means nothing to a build script. `BUILD_API_URL`
 * carries the real one.
 *
 * Getting this right matters more than it looks: the seed catalogue numbers its
 * products from 1001, while the real shop numbers them from 1. Prerendering the
 * seed ids would produce thirty-six files nobody ever requests and none for the
 * products customers actually browse. Those would still work — the server rewrites
 * unknown product URLs onto a shell — but every one would arrive as an empty page
 * that fills in after a round trip, rather than as HTML.
 *
 * If the API is unreachable at build time the seed ids are used and the build
 * still succeeds. The site works either way; only the first paint differs.
 */
const BUILD_API_URL = process.env.BUILD_API_URL ?? "http://localhost:5080/api";

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BUILD_API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Every product id in the shop right now, plus the seed ids as a floor. */
export async function liveProductIds(seed: number[]): Promise<number[]> {
  const rows = await fetchJson<{ id: number }[]>("/products");
  if (!rows || rows.length === 0) {
    console.warn("[build] API unreachable — prerendering the seed product ids only.");
    return seed;
  }

  return [...new Set([...rows.map((p) => p.id), ...seed])];
}

/** Every department slug in the shop right now, plus the seed slugs as a floor. */
export async function liveDepartmentSlugs(seed: string[]): Promise<string[]> {
  const rows = await fetchJson<{ slug: string }[]>("/departments");
  if (!rows || rows.length === 0) return seed;

  return [...new Set([...rows.map((d) => d.slug), ...seed])];
}
