using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmaFuelMarket.Api.Auth;
using SmaFuelMarket.Api.Data;

namespace SmaFuelMarket.Api.Stores;

public class FuelPriceDto
{
    public string Grade { get; set; } = "";
    public decimal Price { get; set; }
}

public class UpdateStoreDto
{
    public string? Name { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Phone { get; set; }
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public double? RadiusMiles { get; set; }
    public string? Hours { get; set; }
    public List<FuelPriceDto>? FuelPrices { get; set; }
}

public record NearestStore(StoreLocationView Store, double Distance, bool InRange);

public static class Geo
{
    private const double EarthRadiusMiles = 3958.8;

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;

    /// <summary>Great-circle distance in miles between two coordinates.</summary>
    public static double HaversineMiles(double lat1, double lng1, double lat2, double lng2)
    {
        var dLat = ToRadians(lat2 - lat1);
        var dLng = ToRadians(lng2 - lng1);
        var a = ToRadians(lat1);
        var b = ToRadians(lat2);

        var h = Math.Pow(Math.Sin(dLat / 2), 2)
            + Math.Pow(Math.Sin(dLng / 2), 2) * Math.Cos(a) * Math.Cos(b);

        return 2 * EarthRadiusMiles * Math.Asin(Math.Sqrt(h));
    }
}

[ApiController]
[Route("store-locations")]
public class StoreLocationsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<StoreLocationView>> FindAll()
    {
        var rows = await db.StoreLocations.AsNoTracking()
            .Include(s => s.FuelPrices)
            .ToListAsync();
        return rows.Select(StoreLocationView.From);
    }

    /// <summary>
    /// The closest store to a point, and whether it will deliver there.
    /// </summary>
    /// <remarks>
    /// The catalogue is browsable from anywhere, but ordering is gated on being
    /// inside the store's radius, and this is what the storefront asks to decide
    /// that. A shop with no locations answers null rather than pretending the
    /// customer is out of range — no stores is a setup problem, not a refusal.
    /// </remarks>
    [HttpGet("nearest")]
    public async Task<NearestStore?> Nearest([FromQuery] double lat, [FromQuery] double lng)
    {
        var stores = await db.StoreLocations.AsNoTracking()
            .Include(s => s.FuelPrices)
            .ToListAsync();

        if (stores.Count == 0) return null;

        var best = stores[0];
        var bestDistance = Geo.HaversineMiles(lat, lng, best.Lat, best.Lng);

        foreach (var store in stores.Skip(1))
        {
            var distance = Geo.HaversineMiles(lat, lng, store.Lat, store.Lng);
            if (distance < bestDistance)
            {
                best = store;
                bestDistance = distance;
            }
        }

        return new NearestStore(StoreLocationView.From(best), bestDistance, bestDistance <= best.RadiusMiles);
    }

    /// <summary>
    /// Updates a store, replacing its fuel prices wholesale when supplied.
    /// </summary>
    /// <remarks>
    /// Prices are deleted and recreated rather than diffed: the grid is edited as
    /// one block in the admin panel, so a grade removed there must disappear here,
    /// and an upsert-only pass would leave it behind for ever.
    /// </remarks>
    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpPatch("{id:int}")]
    public async Task<StoreLocationView> Update(int id, [FromBody] UpdateStoreDto dto)
    {
        var store = await db.StoreLocations.Include(s => s.FuelPrices)
            .FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new NotFoundError($"Store {id} not found");

        await using var tx = await db.Database.BeginTransactionAsync();

        if (dto.Name is not null) store.Name = dto.Name;
        if (dto.Address is not null) store.Address = dto.Address;
        if (dto.City is not null) store.City = dto.City;
        if (dto.Phone is not null) store.Phone = dto.Phone;
        if (dto.Lat is not null) store.Lat = dto.Lat.Value;
        if (dto.Lng is not null) store.Lng = dto.Lng.Value;
        if (dto.RadiusMiles is not null) store.RadiusMiles = dto.RadiusMiles.Value;
        if (dto.Hours is not null) store.Hours = dto.Hours;

        if (dto.FuelPrices is not null)
        {
            db.FuelPrices.RemoveRange(store.FuelPrices);
            store.FuelPrices = dto.FuelPrices
                .Select(f => new FuelPrice { StoreId = id, Grade = f.Grade, Price = f.Price })
                .ToList();
        }

        await db.SaveChangesAsync();
        await tx.CommitAsync();

        return StoreLocationView.From(store);
    }
}
