using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmaFuelMarket.Api.Data;

/*
 * The shop's tables, carried over from the Prisma schema the Node API used.
 *
 * Surrogate keys are integers throughout, because they read well in a URL and
 * an admin can say "order 41" out loud. Departments and categories keep a
 * human-readable slug as their key instead — it doubles as the URL segment, so
 * a number there would replace something meaningful with something opaque.
 */

public enum Role
{
    CUSTOMER,
    ADMIN,
}

public enum OrderStatus
{
    PENDING,
    CONFIRMED,
    PREPARING,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED,
}

public enum DealKind
{
    flash,
    percent,
    bogo,
    weekend,
}

public class User
{
    public int Id { get; set; }
    [Required, MaxLength(255)] public string Email { get; set; } = "";
    [Required] public string PasswordHash { get; set; } = "";
    [Required, MaxLength(200)] public string Name { get; set; } = "";
    [MaxLength(40)] public string? Phone { get; set; }
    public Role Role { get; set; } = Role.CUSTOMER;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<Address> Addresses { get; set; } = [];
    public List<Order> Orders { get; set; } = [];
    public List<Review> Reviews { get; set; } = [];
    public List<PasswordResetToken> PasswordResets { get; set; } = [];
}

public class Address
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    [Required, MaxLength(80)] public string Label { get; set; } = "";
    [Required, MaxLength(255)] public string Line1 { get; set; } = "";
    [MaxLength(255)] public string? Line2 { get; set; }
    [Required, MaxLength(120)] public string City { get; set; } = "";
    /// <summary>Optional: the shop delivers inside a single metro area, so
    /// checkout does not ask for a state.</summary>
    [MaxLength(120)] public string? State { get; set; }
    [Required, MaxLength(20)] public string Zip { get; set; } = "";
    /// <summary>Contact name for the driver at the door.</summary>
    [MaxLength(200)] public string? Recipient { get; set; }
    [MaxLength(500)] public string? Notes { get; set; }
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Order> Orders { get; set; } = [];
}

public class Department
{
    [Key, MaxLength(60)] public string Slug { get; set; } = "";
    [Required, MaxLength(120)] public string Name { get; set; } = "";
    [Required, MaxLength(255)] public string Blurb { get; set; } = "";
    /// <summary>Uploaded artwork; null falls back to the generated illustration.</summary>
    [MaxLength(400)] public string? ImageUrl { get; set; }
    [Required, MaxLength(60)] public string Art { get; set; } = "";
    public int Hue { get; set; }
    public bool AgeRestricted { get; set; }
    public int SortOrder { get; set; }

    public List<Category> Categories { get; set; } = [];
    public List<Product> Products { get; set; } = [];
}

public class Category
{
    [Key, MaxLength(60)] public string Slug { get; set; } = "";
    [Required, MaxLength(120)] public string Name { get; set; } = "";
    [Required, MaxLength(60)] public string Art { get; set; } = "";
    public int Hue { get; set; }
    [Required, MaxLength(60)] public string DepartmentSlug { get; set; } = "";
    public Department? Department { get; set; }

    public List<Product> Products { get; set; } = [];
}

public class Product
{
    public int Id { get; set; }
    [Required, MaxLength(60)] public string Sku { get; set; } = "";
    [Required, MaxLength(60)] public string Barcode { get; set; } = "";
    [Required, MaxLength(255)] public string Title { get; set; } = "";
    [Required, MaxLength(120)] public string Brand { get; set; } = "";
    [Required, MaxLength(60)] public string DepartmentSlug { get; set; } = "";
    public Department? Department { get; set; }
    [Required, MaxLength(60)] public string CategorySlug { get; set; } = "";
    public Category? Category { get; set; }
    [Required, MaxLength(80)] public string Unit { get; set; } = "";

    [Column(TypeName = "decimal(10,2)")] public decimal Price { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? ListPrice { get; set; }

    public int Stock { get; set; }
    public int LowStockAt { get; set; }

    /// <summary>Average of the product's reviews, recomputed on every review
    /// write. Cached here rather than aggregated on each read, since the
    /// catalogue lists dozens of products at once.</summary>
    public double Rating { get; set; }
    /// <summary>Count of reviews, kept in step with <see cref="Rating"/>.</summary>
    public int Reviews { get; set; }

    [MaxLength(400)] public string? ImageUrl { get; set; }
    [Required, MaxLength(60)] public string Art { get; set; } = "";
    public int Hue { get; set; }
    public bool AgeRestricted { get; set; }

    /// <summary>Stored as JSON: only ever read and written whole, never queried
    /// on their own, so a child table would add joins for nothing.</summary>
    public string TagsJson { get; set; } = "[]";
    public string BulletsJson { get; set; } = "[]";

    [Required] public string Description { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<OrderItem> OrderItems { get; set; } = [];
    public List<Deal> Deals { get; set; } = [];
    public List<Review> ProductReviews { get; set; } = [];
}

public class StoreLocation
{
    public int Id { get; set; }
    [Required, MaxLength(200)] public string Name { get; set; } = "";
    [Required, MaxLength(255)] public string Address { get; set; } = "";
    [Required, MaxLength(120)] public string City { get; set; } = "";
    [Required, MaxLength(60)] public string Phone { get; set; } = "";
    public double Lat { get; set; }
    public double Lng { get; set; }
    /// <summary>Delivery radius in miles. These coordinates decide who may
    /// order, so a placeholder here silently refuses every real customer.</summary>
    public double RadiusMiles { get; set; }
    [Required, MaxLength(120)] public string Hours { get; set; } = "";

    public List<FuelPrice> FuelPrices { get; set; } = [];
}

public class FuelPrice
{
    public int Id { get; set; }
    public int StoreId { get; set; }
    public StoreLocation? Store { get; set; }
    [Required, MaxLength(60)] public string Grade { get; set; } = "";
    [Column(TypeName = "decimal(10,2)")] public decimal Price { get; set; }
}

public class HeroSlide
{
    public int Id { get; set; }
    public int SortOrder { get; set; }
    [Required, MaxLength(200)] public string Eyebrow { get; set; } = "";
    [Required, MaxLength(255)] public string Title { get; set; } = "";
    [Required, MaxLength(500)] public string Blurb { get; set; } = "";
    [Required, MaxLength(20)] public string BadgeBig { get; set; } = "";
    [Required, MaxLength(60)] public string BadgeSmall { get; set; } = "";
    [Required, MaxLength(80)] public string CtaLabel { get; set; } = "";
    [Required, MaxLength(200)] public string CtaHref { get; set; } = "";
    [Required, MaxLength(20)] public string Accent { get; set; } = "#00b04f";
    public string TileImagesJson { get; set; } = "[]";
    public string FallbackArtJson { get; set; } = "[]";
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class ShowcaseCard
{
    public int Id { get; set; }
    public int SortOrder { get; set; }
    [Required, MaxLength(200)] public string Title { get; set; } = "";
    [Required, MaxLength(120)] public string LinkLabel { get; set; } = "";
    [Required, MaxLength(200)] public string LinkHref { get; set; } = "";
    /// <summary><c>grid</c> shows a 2x2 of tiles, <c>single</c> one large image.</summary>
    [Required, MaxLength(20)] public string Variant { get; set; } = "grid";
    public string TilesJson { get; set; } = "[]";
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Deal
{
    public int Id { get; set; }
    public DealKind Kind { get; set; }
    [Required, MaxLength(200)] public string Title { get; set; } = "";
    [Required, MaxLength(500)] public string Detail { get; set; } = "";
    public int? PercentOff { get; set; }
    /// <summary>Hours the promotion runs for. Null means ongoing.</summary>
    public int? EndsInHours { get; set; }
    [MaxLength(400)] public string? ImageUrl { get; set; }
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<Product> Products { get; set; } = [];
}

public class Order
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public int? AddressId { get; set; }
    public Address? Address { get; set; }

    [Column(TypeName = "decimal(10,2)")] public decimal Subtotal { get; set; }
    /// <summary>Taken off automatically by the shop's promotions, recorded apart
    /// from <see cref="Discount"/> so a receipt can tell a customer what the shop
    /// gave them from what they claimed with a code.</summary>
    [Column(TypeName = "decimal(10,2)")] public decimal DealDiscount { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal Discount { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal DeliveryFee { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal Tax { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal Total { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.PENDING;
    [MaxLength(60)] public string? CouponCode { get; set; }
    public DateTime PlacedAt { get; set; } = DateTime.UtcNow;

    public List<OrderItem> Items { get; set; } = [];
}

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public int Quantity { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal UnitPrice { get; set; }
}

/// <summary>
/// A customer's star rating and comment. One review per customer per product —
/// resubmitting edits it rather than stacking duplicates. <see cref="VerifiedPurchase"/>
/// is stamped from real order history, never taken from the request.
/// </summary>
public class Review
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public int Rating { get; set; }
    [MaxLength(120)] public string? Title { get; set; }
    [Required, MaxLength(2000)] public string Body { get; set; } = "";
    public bool VerifiedPurchase { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// A single-use, expiring password-reset grant. Only a SHA-256 hash of the
/// token is stored, so a leaked database still cannot reset anyone's password —
/// the same reasoning as never storing raw passwords.
/// </summary>
public class PasswordResetToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    [Required, MaxLength(128)] public string TokenHash { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
    /// <summary>Set the moment the token is spent, so a link cannot be replayed.</summary>
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
