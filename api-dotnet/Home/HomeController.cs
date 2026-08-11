using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmaFuelMarket.Api.Auth;
using SmaFuelMarket.Api.Data;

namespace SmaFuelMarket.Api.Home;

public class CreateHeroSlideDto
{
    public int? SortOrder { get; set; }

    [Required] public string Eyebrow { get; set; } = "";
    [Required] public string Title { get; set; } = "";
    [Required] public string Blurb { get; set; } = "";
    [Required] public string BadgeBig { get; set; } = "";
    [Required] public string BadgeSmall { get; set; } = "";
    [Required] public string CtaLabel { get; set; } = "";
    [Required] public string CtaHref { get; set; } = "";

    public string? Accent { get; set; }

    /// <summary>Uploaded tile artwork, in display order. Empty strings mean "use the glyph".</summary>
    [MaxLength(4)] public string[]? TileImages { get; set; }
    [MaxLength(4)] public string[]? FallbackArt { get; set; }

    public bool? Active { get; set; }
}

public class UpdateHeroSlideDto
{
    public int? SortOrder { get; set; }
    public string? Eyebrow { get; set; }
    public string? Title { get; set; }
    public string? Blurb { get; set; }
    public string? BadgeBig { get; set; }
    public string? BadgeSmall { get; set; }
    public string? CtaLabel { get; set; }
    public string? CtaHref { get; set; }
    public string? Accent { get; set; }
    [MaxLength(4)] public string[]? TileImages { get; set; }
    [MaxLength(4)] public string[]? FallbackArt { get; set; }
    public bool? Active { get; set; }
}

public class ShowcaseTileDto
{
    [Required] public string Label { get; set; } = "";
    [Required] public string Href { get; set; } = "";
    public string? ImageUrl { get; set; }
    [Required] public string Art { get; set; } = "";
    [Range(0, 360)] public int Hue { get; set; }
}

public class CreateShowcaseCardDto
{
    public int? SortOrder { get; set; }
    [Required] public string Title { get; set; } = "";
    [Required] public string LinkLabel { get; set; } = "";
    [Required] public string LinkHref { get; set; } = "";
    public string? Variant { get; set; }
    [MaxLength(4)] public List<ShowcaseTileDto> Tiles { get; set; } = [];
    public bool? Active { get; set; }
}

public class UpdateShowcaseCardDto
{
    public int? SortOrder { get; set; }
    public string? Title { get; set; }
    public string? LinkLabel { get; set; }
    public string? LinkHref { get; set; }
    public string? Variant { get; set; }
    [MaxLength(4)] public List<ShowcaseTileDto>? Tiles { get; set; }
    public bool? Active { get; set; }
}

/// <summary>
/// The editable parts of the home page: the hero carousel and the showcase grid.
/// </summary>
/// <remarks>
/// Both are ordered by <c>sortOrder</c> so the admin decides what a visitor sees
/// first, and both hide inactive rows from the storefront while the admin panel
/// asks for them with <c>includeInactive</c> — a slide being worked on should not
/// appear in the shop, but it must still be editable.
/// </remarks>
[ApiController]
[Route("home")]
public class HomeController(AppDbContext db) : ControllerBase
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    /* ---- Hero slides ---------------------------------------------------- */

    [HttpGet("hero-slides")]
    public async Task<IEnumerable<HeroSlideView>> HeroSlides([FromQuery] bool includeInactive = false)
    {
        var query = db.HeroSlides.AsNoTracking().AsQueryable();
        if (!includeInactive) query = query.Where(s => s.Active);

        var rows = await query.OrderBy(s => s.SortOrder).ToListAsync();
        return rows.Select(HeroSlideView.From);
    }

    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpPost("hero-slides")]
    public async Task<HeroSlideView> CreateHeroSlide([FromBody] CreateHeroSlideDto dto)
    {
        var slide = new HeroSlide
        {
            SortOrder = dto.SortOrder ?? 0,
            Eyebrow = dto.Eyebrow,
            Title = dto.Title,
            Blurb = dto.Blurb,
            BadgeBig = dto.BadgeBig,
            BadgeSmall = dto.BadgeSmall,
            CtaLabel = dto.CtaLabel,
            CtaHref = dto.CtaHref,
            Accent = dto.Accent ?? "#00b04f",
            TileImagesJson = JsonArray.Write(dto.TileImages),
            FallbackArtJson = JsonArray.Write(dto.FallbackArt),
            Active = dto.Active ?? true,
        };

        db.HeroSlides.Add(slide);
        await db.SaveChangesAsync();
        return HeroSlideView.From(slide);
    }

    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpPatch("hero-slides/{id:int}")]
    public async Task<HeroSlideView> UpdateHeroSlide(int id, [FromBody] UpdateHeroSlideDto dto)
    {
        var slide = await db.HeroSlides.FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new NotFoundError($"Hero slide {id} not found");

        if (dto.SortOrder is not null) slide.SortOrder = dto.SortOrder.Value;
        if (dto.Eyebrow is not null) slide.Eyebrow = dto.Eyebrow;
        if (dto.Title is not null) slide.Title = dto.Title;
        if (dto.Blurb is not null) slide.Blurb = dto.Blurb;
        if (dto.BadgeBig is not null) slide.BadgeBig = dto.BadgeBig;
        if (dto.BadgeSmall is not null) slide.BadgeSmall = dto.BadgeSmall;
        if (dto.CtaLabel is not null) slide.CtaLabel = dto.CtaLabel;
        if (dto.CtaHref is not null) slide.CtaHref = dto.CtaHref;
        if (dto.Accent is not null) slide.Accent = dto.Accent;
        if (dto.TileImages is not null) slide.TileImagesJson = JsonArray.Write(dto.TileImages);
        if (dto.FallbackArt is not null) slide.FallbackArtJson = JsonArray.Write(dto.FallbackArt);
        if (dto.Active is not null) slide.Active = dto.Active.Value;

        slide.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return HeroSlideView.From(slide);
    }

    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpDelete("hero-slides/{id:int}")]
    public async Task<object> RemoveHeroSlide(int id)
    {
        var slide = await db.HeroSlides.FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new NotFoundError($"Hero slide {id} not found");

        db.HeroSlides.Remove(slide);
        await db.SaveChangesAsync();
        return new { id };
    }

    /* ---- Showcase cards -------------------------------------------------- */

    [HttpGet("showcase-cards")]
    public async Task<IEnumerable<ShowcaseCardView>> ShowcaseCards([FromQuery] bool includeInactive = false)
    {
        var query = db.ShowcaseCards.AsNoTracking().AsQueryable();
        if (!includeInactive) query = query.Where(c => c.Active);

        var rows = await query.OrderBy(c => c.SortOrder).ToListAsync();
        return rows.Select(ShowcaseCardView.From);
    }

    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpPost("showcase-cards")]
    public async Task<ShowcaseCardView> CreateShowcaseCard([FromBody] CreateShowcaseCardDto dto)
    {
        var card = new ShowcaseCard
        {
            SortOrder = dto.SortOrder ?? 0,
            Title = dto.Title,
            LinkLabel = dto.LinkLabel,
            LinkHref = dto.LinkHref,
            Variant = dto.Variant ?? "grid",
            TilesJson = JsonSerializer.Serialize(dto.Tiles, Json),
            Active = dto.Active ?? true,
        };

        db.ShowcaseCards.Add(card);
        await db.SaveChangesAsync();
        return ShowcaseCardView.From(card);
    }

    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpPatch("showcase-cards/{id:int}")]
    public async Task<ShowcaseCardView> UpdateShowcaseCard(int id, [FromBody] UpdateShowcaseCardDto dto)
    {
        var card = await db.ShowcaseCards.FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new NotFoundError($"Showcase card {id} not found");

        if (dto.SortOrder is not null) card.SortOrder = dto.SortOrder.Value;
        if (dto.Title is not null) card.Title = dto.Title;
        if (dto.LinkLabel is not null) card.LinkLabel = dto.LinkLabel;
        if (dto.LinkHref is not null) card.LinkHref = dto.LinkHref;
        if (dto.Variant is not null) card.Variant = dto.Variant;
        if (dto.Tiles is not null) card.TilesJson = JsonSerializer.Serialize(dto.Tiles, Json);
        if (dto.Active is not null) card.Active = dto.Active.Value;

        card.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return ShowcaseCardView.From(card);
    }

    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpDelete("showcase-cards/{id:int}")]
    public async Task<object> RemoveShowcaseCard(int id)
    {
        var card = await db.ShowcaseCards.FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new NotFoundError($"Showcase card {id} not found");

        db.ShowcaseCards.Remove(card);
        await db.SaveChangesAsync();
        return new { id };
    }
}
