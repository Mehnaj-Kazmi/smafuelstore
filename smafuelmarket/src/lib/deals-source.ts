import { deals as seedDeals, type Deal, type DealKind } from "./deals";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type ApiDeal = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  percentOff: number | null;
  endsInHours: number | null;
  imageUrl: string | null;
  active: boolean;
  products: { id: string }[];
};

function toDeal(d: ApiDeal): Deal {
  return {
    id: d.id,
    kind: d.kind as DealKind,
    title: d.title,
    detail: d.detail,
    /* The API nests whole products; the storefront only needs their ids. */
    productIds: (d.products ?? []).map((p) => p.id),
    percentOff: d.percentOff ?? undefined,
    endsInHours: d.endsInHours ?? undefined,
    imageUrl: d.imageUrl,
  };
}

/**
 * The promotions the storefront shows.
 *
 * Read from the API so a deal created, edited or photographed in the admin
 * panel is what customers see. The seed list is the fallback for an
 * unreachable API, so the deals page still has content rather than rendering
 * an empty "Running now".
 */
export async function getDeals(): Promise<Deal[]> {
  try {
    const res = await fetch(`${API_URL}/deals`, { cache: "no-store" });
    if (!res.ok) return seedDeals;

    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) return seedDeals;

    return (data as ApiDeal[]).map(toDeal);
  } catch {
    return seedDeals;
  }
}
