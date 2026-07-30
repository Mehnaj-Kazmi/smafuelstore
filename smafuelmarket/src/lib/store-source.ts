import { stores as seedStores, type StoreLocation } from "./store-location";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type ApiStore = {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  lat: number;
  lng: number;
  radiusMiles: number;
  hours: string;
  fuelPrices?: { grade: string; price: string | number }[];
};

function toStore(s: ApiStore): StoreLocation {
  return {
    id: s.id,
    name: s.name,
    address: s.address,
    city: s.city,
    phone: s.phone,
    lat: s.lat,
    lng: s.lng,
    radiusMiles: s.radiusMiles,
    hours: s.hours,
    /* Prisma serialises Decimal as a string, so prices arrive as "3.49". */
    fuelPrices: (s.fuelPrices ?? []).map((f) => ({
      grade: f.grade,
      price: typeof f.price === "number" ? f.price : Number(f.price),
    })),
  };
}

/**
 * The shop's locations, which decide where it delivers.
 *
 * Read from the API rather than a constant, because the delivery-radius check
 * is measured against these coordinates: a store moved in the database while
 * the storefront held a hardcoded pair would quietly reject every customer near
 * the real shop and accept nobody. The seed store is the fallback so an
 * unreachable API still renders opening hours and a phone number.
 */
export async function getStores(): Promise<StoreLocation[]> {
  try {
    const res = await fetch(`${API_URL}/store-locations`, { cache: "no-store" });
    if (!res.ok) return seedStores;

    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) return seedStores;

    return (data as ApiStore[]).map(toStore);
  } catch {
    return seedStores;
  }
}

/** The store everything defaults to when no specific one is chosen. */
export async function getPrimaryStore(): Promise<StoreLocation> {
  return (await getStores())[0];
}
