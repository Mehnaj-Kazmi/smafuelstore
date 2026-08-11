using System.ComponentModel.DataAnnotations;

namespace SmaFuelMarket.Api.Orders;

public class OrderLineDto
{
    public int ProductId { get; set; }
    [Range(1, int.MaxValue)] public int Quantity { get; set; }
}

public class OrderAddressDto
{
    [Required] public string Recipient { get; set; } = "";
    [Required] public string Line1 { get; set; } = "";
    [Required] public string City { get; set; } = "";

    /// <summary>Digits only, matching the checkout form.</summary>
    [RegularExpression(@"^\d{4,10}$", ErrorMessage = "Postcode must be numbers only")]
    public string Zip { get; set; } = "";

    public string? Notes { get; set; }
}

public class CreateOrderDto
{
    [MinLength(1)] public List<OrderLineDto> Items { get; set; } = [];
    [Required] public OrderAddressDto Address { get; set; } = new();
    public string? CouponCode { get; set; }
    public string? PaymentMethod { get; set; }
}

/// <summary>A basket to be priced without placing it, so checkout can show real totals.</summary>
public class QuoteOrderDto
{
    [MinLength(1)] public List<OrderLineDto> Items { get; set; } = [];
    public string? CouponCode { get; set; }
}

public class CheckCouponDto
{
    [Required] public string Code { get; set; } = "";
    public decimal Subtotal { get; set; }
}

public class UpdateOrderStatusDto
{
    [Required] public string Status { get; set; } = "";
}

/// <summary>Totals plus the promotions that produced them, so checkout can name each saving.</summary>
public record QuoteResult(
    decimal Subtotal,
    decimal DealDiscount,
    decimal Discount,
    decimal DeliveryFee,
    decimal Tax,
    decimal Total,
    string? CouponCode,
    IReadOnlyList<LineSaving> Deals);

public record CouponCheck(bool Ok, string? Reason, string? Code, string? Description, decimal? Discount);
