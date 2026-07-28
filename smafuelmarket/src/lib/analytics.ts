import { departments, products, stockState, type Product } from "./catalog";

/**
 * Reporting figures for the admin dashboard.
 *
 * These are derived deterministically from the catalogue rather than randomised,
 * so the same product always contributes the same numbers and screenshots stay
 * stable. When the API lands, each function here maps to one endpoint.
 */

/** Stable pseudo-random in [0,1) from a string, so figures don't move between renders. */
function seeded(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export function unitsSold(p: Product, days = 1): number {
  const base = 4 + Math.round(seeded(p.id) * 26);
  const popularity = p.reviews > 2000 ? 1.6 : p.reviews > 1000 ? 1.2 : 1;
  return Math.round(base * popularity * days);
}

export function revenueFor(p: Product, days = 1): number {
  return unitsSold(p, days) * p.price;
}

export function totals(days = 1) {
  const revenue = products.reduce((s, p) => s + revenueFor(p, days), 0);
  const units = products.reduce((s, p) => s + unitsSold(p, days), 0);
  const orders = Math.round(units / 3.4);
  return {
    revenue,
    units,
    orders,
    averageOrder: orders > 0 ? revenue / orders : 0,
    customers: Math.round(orders * 0.82),
  };
}

export function bestSellers(limit = 8, days = 1): { product: Product; units: number; revenue: number }[] {
  return products
    .map((p) => ({ product: p, units: unitsSold(p, days), revenue: revenueFor(p, days) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function departmentBreakdown(days = 1) {
  return departments
    .map((d) => {
      const items = products.filter((p) => p.department === d.slug);
      const revenue = items.reduce((s, p) => s + revenueFor(p, days), 0);
      return { department: d, revenue, items: items.length };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export function inventoryStatus() {
  const out = products.filter((p) => stockState(p) === "out");
  const low = products.filter((p) => stockState(p) === "low");
  const value = products.reduce((s, p) => s + p.stock * p.price, 0);
  return { out, low, ok: products.length - out.length - low.length, value };
}

/** Revenue per day across a trailing window, oldest first. */
export function revenueSeries(days: number): { label: string; revenue: number }[] {
  const today = new Date();
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    const wobble = 0.75 + seeded(key) * 0.5;
    const weekendLift = d.getDay() === 0 || d.getDay() === 6 ? 1.25 : 1;
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
      revenue: totals(1).revenue * wobble * weekendLift,
    };
  });
}

export const recentOrders = [
  { id: "GS-8K2L4M", customer: "A. Rahman", items: 6, total: 34.18, status: "out-for-delivery", placed: "12 min ago" },
  { id: "GS-8K2L3P", customer: "J. Okafor", items: 2, total: 8.77, status: "preparing", placed: "18 min ago" },
  { id: "GS-8K2L1A", customer: "M. Delgado", items: 11, total: 61.40, status: "confirmed", placed: "24 min ago" },
  { id: "GS-8K2KZY", customer: "S. Whitfield", items: 3, total: 15.96, status: "delivered", placed: "41 min ago" },
  { id: "GS-8K2KXQ", customer: "T. Nguyen", items: 8, total: 42.05, status: "delivered", placed: "1 hr ago" },
  { id: "GS-8K2KWD", customer: "L. Petrov", items: 1, total: 3.49, status: "cancelled", placed: "1 hr ago" },
  { id: "GS-8K2KVB", customer: "R. Osei", items: 5, total: 27.31, status: "delivered", placed: "2 hr ago" },
] as const;

export const topCustomers = [
  { name: "M. Delgado", orders: 34, spend: 812.4, since: "Mar 2025" },
  { name: "A. Rahman", orders: 28, spend: 664.15, since: "Jan 2025" },
  { name: "T. Nguyen", orders: 22, spend: 540.9, since: "Jun 2025" },
  { name: "S. Whitfield", orders: 19, spend: 401.22, since: "Sep 2025" },
  { name: "J. Okafor", orders: 15, spend: 288.6, since: "Nov 2025" },
  { name: "R. Osei", orders: 12, spend: 244.8, since: "Feb 2026" },
];
