"use client";

import { money, type OrderStats } from "./orders-api";

export type DaySeries = { label: string; revenue: number };

/**
 * Turns raw orders into the figures the admin views show.
 *
 * Everything here is derived from orders that were actually placed. The
 * dashboard used to render numbers generated from a hash of the product
 * catalogue — stable between reloads, which made them look real, but they moved
 * with the catalogue rather than with trade and could never be reconciled
 * against anything. An empty shop now reads as zero, which is the truth.
 *
 * Cancelled orders are excluded by the API before they reach here.
 */
export function summarise(stats: OrderStats | null) {
  const orders = stats?.orders ?? [];
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const since = (days: number) => {
    const cutoff = startOfDay - (days - 1) * 86_400_000;
    return orders.filter((o) => new Date(o.placedAt).getTime() >= cutoff);
  };

  const sum = (list: typeof orders) => list.reduce((n, o) => n + money(o.total), 0);
  const units = (list: typeof orders) =>
    list.reduce((n, o) => n + o.items.reduce((m, i) => m + i.quantity, 0), 0);

  const today = since(1);
  const week = since(7);
  const month = since(30);

  return {
    orderCount: orders.length,
    customers: stats?.customers ?? 0,
    today: { revenue: sum(today), orders: today.length, units: units(today) },
    week: { revenue: sum(week), orders: week.length },
    month: { revenue: sum(month), orders: month.length },
    averageOrder: orders.length ? sum(orders) / orders.length : 0,
    averageOrderMonth: month.length ? sum(month) / month.length : 0,
  };
}

/** Revenue per day for the last `days` days, oldest first. */
export function revenueSeries(stats: OrderStats | null, days: number): DaySeries[] {
  const orders = stats?.orders ?? [];
  const now = new Date();
  const out: DaySeries[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const next = new Date(d.getTime() + 86_400_000);
    const revenue = orders
      .filter((o) => {
        const t = new Date(o.placedAt).getTime();
        return t >= d.getTime() && t < next.getTime();
      })
      .reduce((n, o) => n + money(o.total), 0);

    out.push({
      label: `${d.getDate()} ${d.toLocaleDateString(undefined, { weekday: "short" })}`,
      revenue,
    });
  }
  return out;
}

/** Best sellers by units, across every order. */
export function bestSellers(stats: OrderStats | null, limit = 8) {
  const tally = new Map<number, { id: number; title: string; units: number; revenue: number }>();

  for (const order of stats?.orders ?? []) {
    for (const item of order.items) {
      const row = tally.get(item.product.id) ?? {
        id: item.product.id,
        title: item.product.title,
        units: 0,
        revenue: 0,
      };
      row.units += item.quantity;
      row.revenue += money(item.unitPrice) * item.quantity;
      tally.set(item.product.id, row);
    }
  }

  return [...tally.values()].sort((a, b) => b.units - a.units).slice(0, limit);
}

/** Revenue split by department. */
export function departmentBreakdown(stats: OrderStats | null) {
  const tally = new Map<string, { slug: string; revenue: number; units: number }>();

  for (const order of stats?.orders ?? []) {
    for (const item of order.items) {
      const slug = item.product.departmentSlug;
      const row = tally.get(slug) ?? { slug, revenue: 0, units: 0 };
      row.revenue += money(item.unitPrice) * item.quantity;
      row.units += item.quantity;
      tally.set(slug, row);
    }
  }

  return [...tally.values()].sort((a, b) => b.revenue - a.revenue);
}
