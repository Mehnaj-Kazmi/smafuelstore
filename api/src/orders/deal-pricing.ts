/**
 * What the shop's promotions actually take off an order.
 *
 * Deals used to be decoration. A product could carry a "Buy One Get One" badge
 * and a slide could advertise 20% off, and neither reached the till — two hot
 * dogs sold under "2 for $5" charged $5.98, and the discount column read zero.
 * Advertising one price and charging another is the worst failure in a shop, so
 * the rules that were only ever drawn are now the rules that are applied.
 *
 * This is deliberately pure: it takes lines and promotions and returns numbers,
 * so it can be reasoned about and tested without a database, and so the totals
 * it produces are the same ones the order is written with.
 */

/** A promotion, reduced to what pricing needs to know. */
export type PricingDeal = {
  id: number;
  kind: 'flash' | 'percent' | 'bogo' | 'weekend';
  title: string;
  percentOff: number | null;
  /** Ids of the products this promotion covers. */
  productIds: number[];
};

export type PricingLine = {
  productId: number;
  quantity: number;
  /** Unit price in currency, already resolved from the database. */
  unitPrice: number;
};

export type LineSaving = {
  productId: number;
  quantity: number;
  /** The promotion that won this line. */
  dealId: number;
  dealTitle: string;
  saving: number;
};

export type DealBreakdown = {
  /** Total taken off the order by promotions. */
  total: number;
  lines: LineSaving[];
};

/** Rounds to whole cents, so money never carries float dust. */
function money(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * What one promotion is worth on one line.
 *
 * `bogo` is read as its name: every second unit is free, so three items pay for
 * two. A percentage deal comes off the whole line. A promotion that covers the
 * product but carries no usable rule is worth nothing rather than assumed.
 */
function savingFor(deal: PricingDeal, line: PricingLine): number {
  if (deal.kind === 'bogo') {
    const free = Math.floor(line.quantity / 2);
    return money(free * line.unitPrice);
  }

  if (deal.percentOff && deal.percentOff > 0) {
    const capped = Math.min(deal.percentOff, 100);
    return money((line.unitPrice * line.quantity * capped) / 100);
  }

  return 0;
}

/**
 * The best promotion for each line, never several at once.
 *
 * Two overlapping promotions on one product is a pricing mistake waiting to
 * happen — stacked percentages can drive a line to nothing, and a customer who
 * finds that will use it. Retail convention is the single best offer, which is
 * also the one the customer expects to have been given.
 */
export function priceDeals(lines: PricingLine[], deals: PricingDeal[]): DealBreakdown {
  const savings: LineSaving[] = [];

  for (const line of lines) {
    let best: LineSaving | null = null;

    for (const deal of deals) {
      if (!deal.productIds.includes(line.productId)) continue;

      const saving = savingFor(deal, line);
      if (saving <= 0) continue;

      if (!best || saving > best.saving) {
        best = {
          productId: line.productId,
          quantity: line.quantity,
          dealId: deal.id,
          dealTitle: deal.title,
          saving,
        };
      }
    }

    /* Never give away more than the line is worth, however a promotion is
       configured — a 100% deal takes the line to zero and stops there. */
    if (best) {
      const lineTotal = money(line.unitPrice * line.quantity);
      best.saving = money(Math.min(best.saving, lineTotal));
      savings.push(best);
    }
  }

  return {
    total: money(savings.reduce((sum, s) => sum + s.saving, 0)),
    lines: savings,
  };
}
