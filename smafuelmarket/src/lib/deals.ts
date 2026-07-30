import { products, type Product } from "./catalog";

export type DealKind = "flash" | "percent" | "bogo" | "weekend";

export type Deal = {
  id: number;
  kind: DealKind;
  title: string;
  detail: string;
  productIds: number[];
  /** Percentage off, for `percent`, `flash` and `weekend` deals. */
  percentOff?: number;
  /** Hours from the session start that a flash deal runs for. */
  endsInHours?: number;
  /** Promotional artwork uploaded in the admin panel. */
  imageUrl?: string | null;
};

export const dealKindLabel: Record<DealKind, string> = {
  flash: "Flash Sale",
  percent: "% Off",
  bogo: "Buy One Get One",
  weekend: "Weekend Deal",
};

export const dealKindClass: Record<DealKind, string> = {
  flash: "bg-sma-deal text-white",
  percent: "bg-brand-orange text-black",
  bogo: "bg-brand-green text-black",
  weekend: "bg-white text-black",
};

export const deals: Deal[] = [
  {
    id: 1,
    kind: "flash",
    title: "Coffee & donut for $3",
    detail: "Any large fresh brew with a glazed donut. Today only, while stocks last.",
    productIds: [1004, 1011],
    endsInHours: 6,
  },
  {
    id: 2,
    kind: "bogo",
    title: "2 roller grill hot dogs for $5",
    detail: "Mix and match any two hot dogs from the roller grill.",
    productIds: [1013],
  },
  {
    id: 3,
    kind: "percent",
    title: "20% off all energy drinks",
    detail: "Every energy can in the cooler, no limit.",
    productIds: [1002],
    percentOff: 20,
  },
  {
    id: 4,
    kind: "weekend",
    title: "Weekend snack bundle — 25% off",
    detail: "Chips, jerky and nuts. Friday through Sunday.",
    productIds: [1006, 1008, 1009],
    percentOff: 25,
  },
  {
    id: 5,
    kind: "flash",
    title: "$7 off full synthetic oil",
    detail: "5 quart jug of MotorMax 5W-30. Ends tonight.",
    productIds: [1020],
    endsInHours: 10,
  },
  {
    id: 6,
    kind: "percent",
    title: "Household savings",
    detail: "Paper towels and frozen treats marked down this week.",
    productIds: [1026, 1019],
    percentOff: 20,
  },
];

/** Products carrying a live discount, best discount first. */
export function dealProducts(source: Product[] = products, dealList: Deal[] = deals): Product[] {
  const ids = new Set(dealList.flatMap((d) => d.productIds));
  return source
    .filter((p) => ids.has(p.id) || (p.listPrice != null && p.listPrice > p.price))
    .sort((a, b) => {
      const da = a.listPrice ? (a.listPrice - a.price) / a.listPrice : 0;
      const db = b.listPrice ? (b.listPrice - b.price) / b.listPrice : 0;
      return db - da;
    });
}

export function dealsForProduct(id: number, dealList: Deal[] = deals): Deal[] {
  return dealList.filter((d) => d.productIds.includes(id));
}

/* ---- Coupons ------------------------------------------------------------ */

export type Coupon = {
  code: string;
  description: string;
  /** Percentage off the order subtotal. */
  percentOff?: number;
  /** Flat amount off the order subtotal. */
  amountOff?: number;
  minSpend?: number;
};

export const coupons: Coupon[] = [
  { code: "FUEL5", description: "$5 off orders over $30", amountOff: 5, minSpend: 30 },
  { code: "SNACK10", description: "10% off your order", percentOff: 10 },
  { code: "FIRST15", description: "15% off your first order over $20", percentOff: 15, minSpend: 20 },
];

export type CouponResult =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; reason: string };

/** Validates a code against the subtotal and returns the discount it yields. */
export function applyCoupon(code: string, subtotal: number): CouponResult {
  const coupon = coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
  if (!coupon) return { ok: false, reason: "That code isn't recognised" };

  if (coupon.minSpend != null && subtotal < coupon.minSpend) {
    return { ok: false, reason: `Spend $${coupon.minSpend.toFixed(2)} to use this code` };
  }

  const discount = coupon.percentOff
    ? (subtotal * coupon.percentOff) / 100
    : Math.min(coupon.amountOff ?? 0, subtotal);

  return { ok: true, coupon, discount };
}
