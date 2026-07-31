/**
 * Order pricing rules.
 *
 * These live on the server because the totals a customer is charged cannot come
 * from the browser — the checkout page computes the same numbers for display,
 * but only this copy decides what is stored on the order.
 *
 * The frontend mirrors these constants; they must be changed together.
 */
export const TAX_RATE = 0.08;
export const DELIVERY_FEE = 3.99;
export const FREE_DELIVERY_OVER = 20;

export type Coupon = {
  code: string;
  description: string;
  percentOff?: number;
  amountOff?: number;
  minSpend?: number;
  /**
   * How often one customer may redeem this.
   *
   * Nothing used to enforce these, so a code reading "your first order" applied
   * to every order a customer ever placed — the discount was permanent and the
   * shop simply sold at a standing 15% off. The rule now travels with the
   * coupon, and orders.service checks it against real order history.
   *
   *   first-order  the customer must have no previous order
   *   once         one redemption per customer, ever
   *   unlimited    a standing public offer, redeemable every time
   */
  redemption: 'first-order' | 'once' | 'unlimited';
};

export const COUPONS: Coupon[] = [
  { code: 'FUEL5', description: '$5 off orders over $30', amountOff: 5, minSpend: 30, redemption: 'once' },
  { code: 'SNACK10', description: '10% off your order', percentOff: 10, redemption: 'once' },
  {
    code: 'FIRST15',
    description: '15% off your first order over $20',
    percentOff: 15,
    minSpend: 20,
    redemption: 'first-order',
  },
];

export function findCoupon(code?: string | null): Coupon | undefined {
  if (!code) return undefined;
  return COUPONS.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
}

export type Totals = {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  couponCode: string | null;
};

/** Rounds to whole cents, so stored money never carries float dust. */
function money(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Works out what an order costs.
 *
 * Free delivery is judged on the subtotal *before* any discount. Testing it
 * after meant a valid coupon could push an order under the threshold and add a
 * delivery fee larger than the discount — the customer applied a saving and
 * paid more. Judging on the pre-discount subtotal keeps a coupon from ever
 * costing money.
 */
export function priceOrder(
  subtotalRaw: number,
  couponCode?: string | null,
  /**
   * Whether this customer is still entitled to redeem it, judged from their
   * order history by the caller. Defaults to true so the pure-pricing tests and
   * any display-only use keep working; the order path always passes it.
   */
  redeemable = true,
): Totals {
  const subtotal = money(subtotalRaw);

  const coupon = findCoupon(couponCode);

  const usable = coupon && redeemable && (coupon.minSpend == null || subtotal >= coupon.minSpend);

  let discount = 0;
  if (usable && coupon) {
    discount = coupon.percentOff
      ? (subtotal * coupon.percentOff) / 100
      : Math.min(coupon.amountOff ?? 0, subtotal);
  }
  discount = money(discount);

  const discounted = Math.max(0, money(subtotal - discount));
  const deliveryFee = subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  const tax = money(discounted * TAX_RATE);
  const total = money(discounted + deliveryFee + tax);

  return {
    subtotal,
    discount,
    deliveryFee,
    tax,
    total,
    couponCode: usable && coupon ? coupon.code : null,
  };
}
