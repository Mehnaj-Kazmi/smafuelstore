namespace SmaFuelMarket.Api.Orders;

/*
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

/// <summary>A promotion, reduced to what pricing needs to know.</summary>
public record PricingDeal(int Id, string Kind, string Title, int? PercentOff, IReadOnlyList<int> ProductIds);

public record PricingLine(int ProductId, int Quantity, decimal UnitPrice);

public record LineSaving(int ProductId, int Quantity, int DealId, string DealTitle, decimal Saving);

public record DealBreakdown(decimal Total, IReadOnlyList<LineSaving> Lines);

public static class DealPricing
{
    /// <summary>Rounds to whole cents, so money never carries stray fractions.</summary>
    internal static decimal Money(decimal n) => Math.Round(n, 2, MidpointRounding.AwayFromZero);

    /// <summary>
    /// What one promotion is worth on one line.
    /// </summary>
    /// <remarks>
    /// <c>bogo</c> is read as its name: every second unit is free, so three items
    /// pay for two. A percentage deal comes off the whole line. A promotion that
    /// covers the product but carries no usable rule is worth nothing rather than
    /// assumed.
    /// </remarks>
    private static decimal SavingFor(PricingDeal deal, PricingLine line)
    {
        if (deal.Kind == "bogo")
        {
            var free = line.Quantity / 2;
            return Money(free * line.UnitPrice);
        }

        if (deal.PercentOff is > 0)
        {
            var capped = Math.Min(deal.PercentOff.Value, 100);
            return Money(line.UnitPrice * line.Quantity * capped / 100m);
        }

        return 0m;
    }

    /// <summary>
    /// The best promotion for each line, never several at once.
    /// </summary>
    /// <remarks>
    /// Two overlapping promotions on one product is a pricing mistake waiting to
    /// happen — stacked percentages can drive a line to nothing, and a customer
    /// who finds that will use it. Retail convention is the single best offer,
    /// which is also the one the customer expects to have been given.
    /// </remarks>
    public static DealBreakdown PriceDeals(IEnumerable<PricingLine> lines, IEnumerable<PricingDeal> deals)
    {
        var dealList = deals.ToList();
        var savings = new List<LineSaving>();

        foreach (var line in lines)
        {
            LineSaving? best = null;

            foreach (var deal in dealList)
            {
                if (!deal.ProductIds.Contains(line.ProductId)) continue;

                var saving = SavingFor(deal, line);
                if (saving <= 0) continue;

                if (best is null || saving > best.Saving)
                {
                    best = new LineSaving(line.ProductId, line.Quantity, deal.Id, deal.Title, saving);
                }
            }

            /* Never give away more than the line is worth, however a promotion is
               configured — a 100% deal takes the line to zero and stops there. */
            if (best is not null)
            {
                var lineTotal = Money(line.UnitPrice * line.Quantity);
                savings.Add(best with { Saving = Money(Math.Min(best.Saving, lineTotal)) });
            }
        }

        return new DealBreakdown(Money(savings.Sum(s => s.Saving)), savings);
    }
}
