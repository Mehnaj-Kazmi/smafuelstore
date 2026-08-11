using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmaFuelMarket.Api.Auth;
using SmaFuelMarket.Api.Data;

namespace SmaFuelMarket.Api.Deals;

public class CreateDealDto
{
    [Required] public string Kind { get; set; } = "";
    [Required] public string Title { get; set; } = "";
    [Required] public string Detail { get; set; } = "";

    [Range(1, 99)] public int? PercentOff { get; set; }
    [Range(1, int.MaxValue)] public int? EndsInHours { get; set; }

    /// <summary>Path returned by POST /api/uploads/product-image.</summary>
    public string? ImageUrl { get; set; }

    public bool? Active { get; set; }

    /// <summary>Products covered by this promotion.</summary>
    [MinLength(1)] public int[] ProductIds { get; set; } = [];
}

public class UpdateDealDto
{
    public string? Kind { get; set; }
    public string? Title { get; set; }
    public string? Detail { get; set; }
    [Range(1, 99)] public int? PercentOff { get; set; }
    [Range(1, int.MaxValue)] public int? EndsInHours { get; set; }
    public string? ImageUrl { get; set; }
    public bool? Active { get; set; }
    public int[]? ProductIds { get; set; }
}

[ApiController]
[Route("deals")]
public class DealsController(AppDbContext db) : ControllerBase
{
    /// <summary>Products are returned with each deal so the storefront needs one request.</summary>
    private IQueryable<Deal> WithProducts() => db.Deals.Include(d => d.Products);

    [HttpGet]
    public async Task<IEnumerable<DealView>> FindAll([FromQuery] bool includeInactive = false)
    {
        var query = WithProducts().AsNoTracking();
        if (!includeInactive) query = query.Where(d => d.Active);

        var rows = await query.OrderByDescending(d => d.CreatedAt).ToListAsync();
        return rows.Select(DealView.From);
    }

    [HttpGet("{id:int}")]
    public async Task<DealView> FindOne(int id)
    {
        var deal = await WithProducts().AsNoTracking().FirstOrDefaultAsync(d => d.Id == id)
            ?? throw new NotFoundError($"Deal {id} not found");
        return DealView.From(deal);
    }

    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpPost]
    public async Task<DealView> Create([FromBody] CreateDealDto dto)
    {
        var deal = new Deal
        {
            Kind = ParseKind(dto.Kind),
            Title = dto.Title,
            Detail = dto.Detail,
            PercentOff = dto.PercentOff,
            EndsInHours = dto.EndsInHours,
            ImageUrl = dto.ImageUrl,
            Active = dto.Active ?? true,
            Products = await ProductsByIdAsync(dto.ProductIds),
        };

        db.Deals.Add(deal);
        await db.SaveChangesAsync();
        return DealView.From(deal);
    }

    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpPatch("{id:int}")]
    public async Task<DealView> Update(int id, [FromBody] UpdateDealDto dto)
    {
        var deal = await WithProducts().FirstOrDefaultAsync(d => d.Id == id)
            ?? throw new NotFoundError($"Deal {id} not found");

        if (dto.Kind is not null) deal.Kind = ParseKind(dto.Kind);
        if (dto.Title is not null) deal.Title = dto.Title;
        if (dto.Detail is not null) deal.Detail = dto.Detail;
        if (dto.PercentOff is not null) deal.PercentOff = dto.PercentOff;
        if (dto.EndsInHours is not null) deal.EndsInHours = dto.EndsInHours;
        if (dto.ImageUrl is not null) deal.ImageUrl = dto.ImageUrl;
        if (dto.Active is not null) deal.Active = dto.Active.Value;

        /* Replaced outright rather than added to: an edit sets the promotion's
           product list, so taking an item out of the form has to take it out of
           the deal. Adding only would mean a product could never be removed. */
        if (dto.ProductIds is not null)
        {
            deal.Products.Clear();
            foreach (var product in await ProductsByIdAsync(dto.ProductIds))
                deal.Products.Add(product);
        }

        deal.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return DealView.From(deal);
    }

    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpDelete("{id:int}")]
    public async Task<object> Remove(int id)
    {
        var deal = await db.Deals.FirstOrDefaultAsync(d => d.Id == id)
            ?? throw new NotFoundError($"Deal {id} not found");

        db.Deals.Remove(deal);
        await db.SaveChangesAsync();
        return new { id };
    }

    /// <summary>
    /// Loads the products a promotion covers, refusing ids that do not exist.
    /// </summary>
    /// <remarks>
    /// Silently dropping an unknown id would create a deal quietly covering fewer
    /// products than the admin selected, and the mismatch would only show up as a
    /// customer not getting a discount they were promised.
    /// </remarks>
    private async Task<List<Product>> ProductsByIdAsync(int[] ids)
    {
        var products = await db.Products.Where(p => ids.Contains(p.Id)).ToListAsync();

        if (products.Count != ids.Distinct().Count())
        {
            var missing = ids.Distinct().Except(products.Select(p => p.Id));
            throw new BadRequestError($"No product with id {string.Join(", ", missing)}");
        }

        return products;
    }

    private static DealKind ParseKind(string kind) =>
        Enum.TryParse<DealKind>(kind, ignoreCase: true, out var parsed)
            ? parsed
            : throw new BadRequestError(
                $"'{kind}' is not a kind of deal. Use one of: {string.Join(", ", Enum.GetNames<DealKind>())}");
}
