namespace SmaFuelMarket.Api.Orders;

/// <summary>
/// How often one customer may redeem a code.
/// </summary>
/// <remarks>
/// Nothing used to enforce these, so a code reading "your first order" applied
/// to every order a customer ever placed — the discount was permanent and the
/// shop simply sold at a standing 15% off. The rule now travels with the coupon,
/// and OrdersService checks it against real order history.
/// </remarks>
public enum Redemption
{
    /// <summary>The customer must have no previous order.</summary>
    FirstOrder,

    /// <summary>One redemption per customer, ever.</summary>
    Once,

    /// <summary>A standing public offer, redeemable every time.</summary>
    Unlimited,
}

public record Coupon(
    string Code,
    string Description,
    Redemption Redemption,
    int? PercentOff = null,
    decimal? AmountOff = null,
    decimal? MinSpend = null);

public record Totals(
    decimal Subtotal,
    // Taken off automatically by the shop's promotions.
    decimal DealDiscount,
    // Taken off by a coupon code the customer entered.
    decimal Discount,
    decimal DeliveryFee,
    decimal Tax,
    decimal Total,
    string? CouponCode);

/// <summary>
/// Order pricing rules.
/// </summary>
/// <remarks>
/// These live on the server because the totals a customer is charged cannot come
/// from the browser — the checkout page computes the same numbers for display,
/// but only this copy decides what is stored on the order.
///
/// The frontend mirrors these constants; they must be changed together.
/// </remarks>
public static class Pricing
{
    public const decimal TaxRate = 0.08m;
    public const decimal DeliveryFee = 3.99m;
    public const decimal FreeDeliveryOver = 20m;

    public static readonly IReadOnlyList<Coupon> Coupons =
    [
        new("FUEL5", "$5 off orders over $30", Redemption.Once, AmountOff: 5m, MinSpend: 30m),
        new("SNACK10", "10% off your order", Redemption.Once, PercentOff: 10),
        new("FIRST15", "15% off your first order over $20", Redemption.FirstOrder, PercentOff: 15, MinSpend: 20m),
    ];

    public static Coupon? FindCoupon(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        return Coupons.FirstOrDefault(c =>
            string.Equals(c.Code, code.Trim(), StringComparison.OrdinalIgnoreCase));
    }

    private static decimal Money(decimal n) => DealPricing.Money(n);

    /// <summary>
    /// Works out what an order costs.
    /// </summary>
    /// <param name="redeemable">
    /// Whether this customer is still entitled to redeem the code, judged from
    /// their order history by the caller. Defaults to true so display-only uses
    /// keep working; the order path always passes it.
    /// </param>
    /// <param name="dealDiscountRaw">
    /// What the shop's own promotions already took off, from PriceDeals. These
    /// apply automatically — the customer opts into nothing — so they come off
    /// before a coupon is considered.
    /// </param>
    /// <remarks>
    /// Free delivery is judged on the subtotal <em>before</em> any discount.
    /// Testing it after meant a valid coupon could push an order under the
    /// threshold and add a delivery fee larger than the discount — the customer
    /// applied a saving and paid more. Judging on the pre-discount subtotal keeps
    /// a coupon from ever costing money.
    /// </remarks>
    public static Totals PriceOrder(
        decimal subtotalRaw,
        string? couponCode = null,
        bool redeemable = true,
        decimal dealDiscountRaw = 0m)
    {
        var subtotal = Money(subtotalRaw);
        var dealDiscount = Money(Math.Min(Math.Max(0m, dealDiscountRaw), subtotal));

        /* What is left after automatic promotions, and the base a coupon works on.
           Taking a coupon percentage off the full subtotal instead would discount
           the part the shop has already given away, paying the customer twice. */
        var afterDeals = Money(subtotal - dealDiscount);

        var coupon = FindCoupon(couponCode);

        var usable = coupon is not null
            && redeemable
            && (coupon.MinSpend is null || subtotal >= coupon.MinSpend);

        var discount = 0m;
        if (usable && coupon is not null)
        {
            discount = coupon.PercentOff is > 0
                ? afterDeals * coupon.PercentOff.Value / 100m
                : Math.Min(coupon.AmountOff ?? 0m, afterDeals);
        }
        discount = Money(discount);

        var discounted = Math.Max(0m, Money(afterDeals - discount));
        var delivery = subtotal >= FreeDeliveryOver ? 0m : DeliveryFee;
        var tax = Money(discounted * TaxRate);
        var total = Money(discounted + delivery + tax);

        return new Totals(
            subtotal, dealDiscount, discount, delivery, tax, total,
            usable && coupon is not null ? coupon.Code : null);
    }
}
