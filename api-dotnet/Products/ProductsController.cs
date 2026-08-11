using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmaFuelMarket.Api.Auth;
using SmaFuelMarket.Api.Data;

namespace SmaFuelMarket.Api.Products;

[ApiController]
[Route("products")]
public class ProductsController(AppDbContext db) : ControllerBase
{
    /// <summary>Anyone can browse the catalogue.</summary>
    [HttpGet]
    public async Task<IEnumerable<ProductView>> FindAll(
        [FromQuery] string? department,
        [FromQuery] string? category,
        [FromQuery] string? search)
    {
        var query = db.Products.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(department))
            query = query.Where(p => p.DepartmentSlug == department);

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.CategorySlug == category);

        /* MySQL's default collation is case-insensitive, so Contains matches the
           way the old `mode: 'insensitive'` did without a per-query option. */
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Title.Contains(search));

        var rows = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return rows.Select(ProductView.From);
    }

    [HttpGet("{id:int}")]
    public async Task<ProductView> FindOne(int id)
    {
        var product = await db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new NotFoundError("Product not found");
        return ProductView.From(product);
    }

    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpPost]
    public async Task<ProductView> Create([FromBody] CreateProductDto dto)
    {
        var product = new Product
        {
            Sku = dto.Sku,
            Barcode = dto.Barcode,
            Title = dto.Title,
            Brand = dto.Brand,
            DepartmentSlug = dto.DepartmentSlug,
            CategorySlug = dto.CategorySlug,
            Unit = dto.Unit,
            Price = dto.Price,
            ListPrice = dto.ListPrice,
            Stock = dto.Stock,
            LowStockAt = dto.LowStockAt,
            ImageUrl = dto.ImageUrl,
            Art = dto.Art,
            Hue = dto.Hue,
            AgeRestricted = dto.AgeRestricted ?? false,
            TagsJson = JsonArray.Write(dto.Tags),
            BulletsJson = JsonArray.Write(dto.Bullets),
            Description = dto.Description,
        };

        db.Products.Add(product);
        await db.SaveChangesAsync();
        return ProductView.From(product);
    }

    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpPatch("{id:int}")]
    public async Task<ProductView> Update(int id, [FromBody] UpdateProductDto dto)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new NotFoundError("Product not found");

        /* Only what the request actually carried. The admin panel sends the fields
           it changed, so a null here means "leave it" — writing it through would
           blank a title because the form only edited the price. */
        if (dto.Sku is not null) product.Sku = dto.Sku;
        if (dto.Barcode is not null) product.Barcode = dto.Barcode;
        if (dto.Title is not null) product.Title = dto.Title;
        if (dto.Brand is not null) product.Brand = dto.Brand;
        if (dto.DepartmentSlug is not null) product.DepartmentSlug = dto.DepartmentSlug;
        if (dto.CategorySlug is not null) product.CategorySlug = dto.CategorySlug;
        if (dto.Unit is not null) product.Unit = dto.Unit;
        if (dto.Price is not null) product.Price = dto.Price.Value;
        if (dto.ListPrice is not null) product.ListPrice = dto.ListPrice;
        if (dto.Stock is not null) product.Stock = dto.Stock.Value;
        if (dto.LowStockAt is not null) product.LowStockAt = dto.LowStockAt.Value;
        if (dto.ImageUrl is not null) product.ImageUrl = dto.ImageUrl;
        if (dto.Art is not null) product.Art = dto.Art;
        if (dto.Hue is not null) product.Hue = dto.Hue.Value;
        if (dto.AgeRestricted is not null) product.AgeRestricted = dto.AgeRestricted.Value;
        if (dto.Tags is not null) product.TagsJson = JsonArray.Write(dto.Tags);
        if (dto.Bullets is not null) product.BulletsJson = JsonArray.Write(dto.Bullets);
        if (dto.Description is not null) product.Description = dto.Description;

        product.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return ProductView.From(product);
    }

    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpDelete("{id:int}")]
    public async Task<object> Remove(int id)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new NotFoundError("Product not found");

        /* A product that appears on an order cannot be deleted — the order line
           records what was sold, and removing the product would leave a receipt
           pointing at nothing. Saying so is more use than a foreign-key error. */
        if (await db.OrderItems.AnyAsync(i => i.ProductId == id))
        {
            throw new BadRequestError(
                $"{product.Title} appears on past orders and cannot be deleted. Set its stock to 0 to take it off the shop.");
        }

        db.Products.Remove(product);
        await db.SaveChangesAsync();
        return new { id };
    }
}

[ApiController]
[Route("")]
public class CatalogController(AppDbContext db) : ControllerBase
{
    /// <summary>
    /// Ordered by <c>sortOrder</c> then name, so the admin controls the order of
    /// the "Shop by department" row rather than it being alphabetical by accident.
    /// </summary>
    [HttpGet("departments")]
    public async Task<IEnumerable<DepartmentView>> Departments()
    {
        var rows = await db.Departments.AsNoTracking()
            .OrderBy(d => d.SortOrder).ThenBy(d => d.Name)
            .ToListAsync();
        return rows.Select(DepartmentView.From);
    }

    [HttpGet("categories")]
    public async Task<IEnumerable<CategoryView>> Categories()
    {
        var rows = await db.Categories.AsNoTracking().OrderBy(c => c.Name).ToListAsync();
        return rows.Select(CategoryView.From);
    }

    /// <summary>
    /// Departments are edited, never created or deleted here — the catalogue's
    /// shape is fixed by the products that reference these slugs.
    /// </summary>
    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpPatch("departments/{slug}")]
    public async Task<DepartmentView> UpdateDepartment(string slug, [FromBody] UpdateDepartmentDto dto)
    {
        var department = await db.Departments.FirstOrDefaultAsync(d => d.Slug == slug)
            ?? throw new NotFoundError($"Department {slug} not found");

        if (dto.Name is not null) department.Name = dto.Name;
        if (dto.Blurb is not null) department.Blurb = dto.Blurb;
        if (dto.ImageUrl is not null) department.ImageUrl = dto.ImageUrl;
        if (dto.Art is not null) department.Art = dto.Art;
        if (dto.Hue is not null) department.Hue = dto.Hue.Value;
        if (dto.AgeRestricted is not null) department.AgeRestricted = dto.AgeRestricted.Value;
        if (dto.SortOrder is not null) department.SortOrder = dto.SortOrder.Value;

        await db.SaveChangesAsync();
        return DepartmentView.From(department);
    }
}
