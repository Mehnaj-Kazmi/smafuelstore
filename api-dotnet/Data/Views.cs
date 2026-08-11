using System.Text.Json;

namespace SmaFuelMarket.Api.Data;

/*
 * What the API hands back.
 *
 * Kept separate from the entities for two reasons. A password hash and a reset
 * token live on the same objects as a customer's name, and serialising the entity
 * would send them; and the storefront was written against the Node API's exact
 * JSON, so these types pin that shape down rather than leaving it to whatever the
 * ORM happens to produce this week.
 */

public record ProductView(
    int Id,
    string Sku,
    string Barcode,
    string Title,
    string Brand,
    string DepartmentSlug,
    string CategorySlug,
    string Unit,
    decimal Price,
    decimal? ListPrice,
    int Stock,
    int LowStockAt,
    double Rating,
    int Reviews,
    string? ImageUrl,
    string Art,
    int Hue,
    bool AgeRestricted,
    string[] Tags,
    string[] Bullets,
    string Description,
    DateTime CreatedAt,
    DateTime UpdatedAt)
{
    public static ProductView From(Product p) => new(
        p.Id, p.Sku, p.Barcode, p.Title, p.Brand, p.DepartmentSlug, p.CategorySlug,
        p.Unit, p.Price, p.ListPrice, p.Stock, p.LowStockAt, p.Rating, p.Reviews,
        p.ImageUrl, p.Art, p.Hue, p.AgeRestricted,
        JsonArray.Read(p.TagsJson), JsonArray.Read(p.BulletsJson),
        p.Description, p.CreatedAt, p.UpdatedAt);
}

public record DepartmentView(
    string Slug, string Name, string Blurb, string? ImageUrl,
    string Art, int Hue, bool AgeRestricted, int SortOrder)
{
    public static DepartmentView From(Department d) =>
        new(d.Slug, d.Name, d.Blurb, d.ImageUrl, d.Art, d.Hue, d.AgeRestricted, d.SortOrder);
}

public record CategoryView(string Slug, string Name, string Art, int Hue, string DepartmentSlug)
{
    public static CategoryView From(Category c) =>
        new(c.Slug, c.Name, c.Art, c.Hue, c.DepartmentSlug);
}

/// <summary>
/// A deal's products, cut down to what a promotion tile draws. The storefront
/// only reads the ids, but the admin panel lists the covered products by name and
/// picture, and both are served by the same response.
/// </summary>
public record DealProductRef(int Id, string Title, decimal Price, string Art, int Hue, string? ImageUrl);

public record DealView(
    int Id, string Kind, string Title, string Detail,
    int? PercentOff, int? EndsInHours, string? ImageUrl, bool Active,
    IReadOnlyList<DealProductRef> Products)
{
    public static DealView From(Deal d) => new(
        d.Id, d.Kind.ToString(), d.Title, d.Detail, d.PercentOff, d.EndsInHours,
        d.ImageUrl, d.Active,
        d.Products.Select(p => new DealProductRef(p.Id, p.Title, p.Price, p.Art, p.Hue, p.ImageUrl)).ToList());
}

public record FuelPriceView(string Grade, decimal Price);

public record StoreLocationView(
    int Id, string Name, string Address, string City, string Phone,
    double Lat, double Lng, double RadiusMiles, string Hours,
    IReadOnlyList<FuelPriceView> FuelPrices)
{
    public static StoreLocationView From(StoreLocation s) => new(
        s.Id, s.Name, s.Address, s.City, s.Phone, s.Lat, s.Lng, s.RadiusMiles, s.Hours,
        s.FuelPrices.Select(f => new FuelPriceView(f.Grade, f.Price)).ToList());
}

public record HeroSlideView(
    int Id, int SortOrder, string Eyebrow, string Title, string Blurb,
    string BadgeBig, string BadgeSmall, string CtaLabel, string CtaHref, string Accent,
    string[] TileImages, string[] FallbackArt, bool Active)
{
    public static HeroSlideView From(HeroSlide h) => new(
        h.Id, h.SortOrder, h.Eyebrow, h.Title, h.Blurb, h.BadgeBig, h.BadgeSmall,
        h.CtaLabel, h.CtaHref, h.Accent,
        JsonArray.Read(h.TileImagesJson), JsonArray.Read(h.FallbackArtJson), h.Active);
}

/// <summary>
/// One tile on a showcase card. Stored as JSON rather than a table because the
/// tiles are only ever read and written with the card they belong to.
/// </summary>
public record ShowcaseTile(string Label, string Href, string? ImageUrl, string Art, int Hue);

public record ShowcaseCardView(
    int Id, int SortOrder, string Title, string LinkLabel, string LinkHref,
    string Variant, IReadOnlyList<ShowcaseTile> Tiles, bool Active)
{
    private static readonly JsonSerializerOptions Options =
        new(JsonSerializerDefaults.Web);

    public static ShowcaseCardView From(ShowcaseCard c)
    {
        ShowcaseTile[] tiles;
        try
        {
            tiles = JsonSerializer.Deserialize<ShowcaseTile[]>(c.TilesJson, Options) ?? [];
        }
        catch (JsonException)
        {
            tiles = [];
        }

        return new ShowcaseCardView(
            c.Id, c.SortOrder, c.Title, c.LinkLabel, c.LinkHref, c.Variant, tiles, c.Active);
    }
}

/// <summary>
/// Just the display name. A public review listing has no reason to carry the rest
/// of an account, and the reviewer's own id is already on the review itself.
/// </summary>
public record ReviewAuthor(string Name);

public record ReviewView(
    int Id, int ProductId, int UserId, int Rating, string? Title, string Body,
    bool VerifiedPurchase, DateTime CreatedAt, DateTime UpdatedAt, ReviewAuthor? User)
{
    public static ReviewView From(Review r) => new(
        r.Id, r.ProductId, r.UserId, r.Rating, r.Title, r.Body, r.VerifiedPurchase,
        r.CreatedAt, r.UpdatedAt,
        r.User is null ? null : new ReviewAuthor(r.User.Name));
}

public record OrderProductRef(int Id, string Title, string Unit, string Art, int Hue, string? ImageUrl);

public record OrderItemView(int Id, int ProductId, int Quantity, decimal UnitPrice, OrderProductRef? Product)
{
    public static OrderItemView From(OrderItem i) => new(
        i.Id, i.ProductId, i.Quantity, i.UnitPrice,
        i.Product is null ? null : new OrderProductRef(
            i.Product.Id, i.Product.Title, i.Product.Unit, i.Product.Art, i.Product.Hue, i.Product.ImageUrl));
}

public record OrderAddressView(
    int Id, string Label, string Line1, string? Line2, string City, string? State,
    string Zip, string? Recipient, string? Notes);

public record OrderCustomerView(int Id, string Name, string Email, string? Phone);

public record OrderView(
    int Id, int UserId, int? AddressId,
    decimal Subtotal, decimal DealDiscount, decimal Discount,
    decimal DeliveryFee, decimal Tax, decimal Total,
    string Status, string? CouponCode, DateTime PlacedAt,
    IReadOnlyList<OrderItemView> Items,
    OrderAddressView? Address,
    OrderCustomerView? User)
{
    public static OrderView From(Order o) => new(
        o.Id, o.UserId, o.AddressId, o.Subtotal, o.DealDiscount, o.Discount,
        o.DeliveryFee, o.Tax, o.Total, o.Status.ToString(), o.CouponCode, o.PlacedAt,
        o.Items.Select(OrderItemView.From).ToList(),
        o.Address is null ? null : new OrderAddressView(
            o.Address.Id, o.Address.Label, o.Address.Line1, o.Address.Line2,
            o.Address.City, o.Address.State, o.Address.Zip, o.Address.Recipient, o.Address.Notes),
        o.User is null ? null : new OrderCustomerView(o.User.Id, o.User.Name, o.User.Email, o.User.Phone));
}
