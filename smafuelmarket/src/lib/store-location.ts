/**
 * Store location and the delivery-radius rule.
 *
 * The catalogue is browsable from anywhere, but ordering is gated on the
 * customer being inside `radiusMiles` of a store. Distance is computed with the
 * Haversine formula against each store's coordinates.
 *
 * The `stores` array is already plural so adding locations later is a data
 * change, not a code change — `nearestStore` picks the closest one.
 */

export type StoreLocation = {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  lat: number;
  lng: number;
  /** Delivery radius in miles. */
  radiusMiles: number;
  hours: string;
  fuelPrices: { grade: string; price: number }[];
};

export const stores: StoreLocation[] = [
  {
    id: 1,
    name: "SMA Fuel & Market — Karachi",
    address: "Clifton Block 8",
    city: "Karachi",
    phone: "(555) 018-4420",
    lat: 24.811,
    lng: 67.029,
    radiusMiles: 5,
    hours: "Open 24 hours",
    fuelPrices: [
      { grade: "Regular", price: 3.49 },
      { grade: "Plus", price: 3.79 },
      { grade: "Premium", price: 4.09 },
      { grade: "Diesel", price: 3.95 },
    ],
  },
];

export const primaryStore = stores[0];

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in miles between two coordinates. */
export function haversineMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

export type NearestStore = { store: StoreLocation; distance: number; inRange: boolean };

/**
 * Closest store to the customer, and whether they fall inside its delivery
 * radius.
 *
 * Takes the list to search so the caller can pass the stores loaded from the
 * API. Defaulting to the seed list keeps older call sites working, but anything
 * deciding whether a customer can order must pass the live list — measuring
 * against a stale coordinate rejects everyone near the real shop.
 */
export function nearestStore(
  from: { lat: number; lng: number },
  list: StoreLocation[] = stores,
): NearestStore {
  const pool = list.length > 0 ? list : stores;
  let best = pool[0];
  let bestDistance = haversineMiles(from, pool[0]);

  for (const store of pool.slice(1)) {
    const d = haversineMiles(from, store);
    if (d < bestDistance) {
      best = store;
      bestDistance = d;
    }
  }

  return { store: best, distance: bestDistance, inRange: bestDistance <= best.radiusMiles };
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return "less than 0.1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}
