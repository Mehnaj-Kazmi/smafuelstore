export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function money(value: number): string {
  return currency.format(value);
}

/** Splits a price so the cents can be rendered as a superscript, storefront-style. */
export function priceParts(value: number): { whole: string; cents: string } {
  const fixed = value.toFixed(2);
  const [whole, cents] = fixed.split(".");
  return { whole: Number(whole).toLocaleString("en-US"), cents };
}

export function compactCount(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/** Delivery promise used across the PDP, cart and checkout. */
export function deliveryDate(daysFromNow: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
