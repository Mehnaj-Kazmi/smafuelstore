using System.ComponentModel.DataAnnotations;

namespace SmaFuelMarket.Api.Products;

public class CreateProductDto
{
    [Required] public string Sku { get; set; } = "";
    [Required] public string Barcode { get; set; } = "";
    [Required] public string Title { get; set; } = "";
    [Required] public string Brand { get; set; } = "";
    [Required] public string DepartmentSlug { get; set; } = "";
    [Required] public string CategorySlug { get; set; } = "";
    [Required] public string Unit { get; set; } = "";

    [Range(0, double.MaxValue)] public decimal Price { get; set; }
    [Range(0, double.MaxValue)] public decimal? ListPrice { get; set; }

    [Range(0, int.MaxValue)] public int Stock { get; set; }
    [Range(0, int.MaxValue)] public int LowStockAt { get; set; }

    /// <summary>Path returned by POST /api/uploads/product-image, e.g. /uploads/abc.jpg</summary>
    public string? ImageUrl { get; set; }

    [Required] public string Art { get; set; } = "";
    public int Hue { get; set; }

    public bool? AgeRestricted { get; set; }

    public string[] Tags { get; set; } = [];
    public string[] Bullets { get; set; } = [];
    [Required] public string Description { get; set; } = "";
}

/// <summary>
/// A partial edit. Every field is optional, and null means "leave this alone" —
/// the admin panel sends only what changed, so treating a missing field as a
/// blank would wipe the rest of the product.
/// </summary>
public class UpdateProductDto
{
    public string? Sku { get; set; }
    public string? Barcode { get; set; }
    public string? Title { get; set; }
    public string? Brand { get; set; }
    public string? DepartmentSlug { get; set; }
    public string? CategorySlug { get; set; }
    public string? Unit { get; set; }

    [Range(0, double.MaxValue)] public decimal? Price { get; set; }
    [Range(0, double.MaxValue)] public decimal? ListPrice { get; set; }

    [Range(0, int.MaxValue)] public int? Stock { get; set; }
    [Range(0, int.MaxValue)] public int? LowStockAt { get; set; }

    public string? ImageUrl { get; set; }
    public string? Art { get; set; }
    public int? Hue { get; set; }
    public bool? AgeRestricted { get; set; }
    public string[]? Tags { get; set; }
    public string[]? Bullets { get; set; }
    public string? Description { get; set; }
}

public class UpdateDepartmentDto
{
    public string? Name { get; set; }
    public string? Blurb { get; set; }
    public string? ImageUrl { get; set; }
    public string? Art { get; set; }
    public int? Hue { get; set; }
    public bool? AgeRestricted { get; set; }
    public int? SortOrder { get; set; }
}
