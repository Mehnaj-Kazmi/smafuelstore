using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using SmaFuelMarket.Api.Auth;
using SmaFuelMarket.Api.Data;
using SmaFuelMarket.Api.Security;

namespace SmaFuelMarket.Api.Reviews;

public class CreateReviewDto
{
    public int ProductId { get; set; }
    [Range(1, 5)] public int Rating { get; set; }
    [MaxLength(120)] public string? Title { get; set; }
    [Required, MaxLength(2000)] public string Body { get; set; } = "";
}

public record ProductReviews(
    double Average,
    int Count,
    IReadOnlyDictionary<string, int> Breakdown,
    IReadOnlyList<ReviewView> Items);

[ApiController]
[Route("reviews")]
public class ReviewsController(AppDbContext db) : ControllerBase
{
    /// <summary>
    /// Real reviews for a product, newest first, plus the average, count and
    /// star breakdown a product page renders.
    /// </summary>
    [HttpGet]
    public async Task<ProductReviews> ForProduct([FromQuery] int productId)
    {
        var items = await db.Reviews.AsNoTracking()
            .Include(r => r.User)
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        /* Every star present with a zero, so the bar chart on the product page
           draws five rows whatever has been left — a missing key would render as
           a gap rather than "nobody gave this three stars". */
        var breakdown = new Dictionary<string, int>
        {
            ["1"] = 0, ["2"] = 0, ["3"] = 0, ["4"] = 0, ["5"] = 0,
        };
        foreach (var review in items)
        {
            var key = review.Rating.ToString();
            if (breakdown.ContainsKey(key)) breakdown[key]++;
        }

        return new ProductReviews(
            items.Count == 0 ? 0 : items.Average(r => r.Rating),
            items.Count,
            breakdown,
            items.Select(ReviewView.From).ToList());
    }

    /// <summary>The signed-in customer's own review for this product, or null.</summary>
    [Authorize]
    [HttpGet("mine")]
    public async Task<ReviewView?> Mine([FromQuery] int productId)
    {
        var userId = User.Id() ?? throw new UnauthorizedError("Not signed in");

        var review = await db.Reviews.AsNoTracking()
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.ProductId == productId && r.UserId == userId);

        return review is null ? null : ReviewView.From(review);
    }

    /// <summary>
    /// Creates the customer's review, or edits it in place if they already left
    /// one for this product.
    /// </summary>
    /// <remarks>
    /// One review per person per item, matching the unique index on
    /// (ProductId, UserId), so "submit" always means "this is now what I think"
    /// rather than a second stacked entry.
    /// </remarks>
    [Authorize]
    [EnableRateLimiting(ThrottleConfig.ReviewWrite)]
    [HttpPost]
    public async Task<ReviewView> Upsert([FromBody] CreateReviewDto dto)
    {
        var userId = User.Id() ?? throw new UnauthorizedError("Not signed in");

        if (!await db.Products.AnyAsync(p => p.Id == dto.ProductId))
            throw new BadRequestError("Unknown product");

        /*
         * Stamped from real order history rather than trusted from the request —
         * a "Verified purchase" badge that anyone could set on their own review
         * would be worse than not having one at all.
         */
        var purchased = await db.OrderItems.AnyAsync(i =>
            i.ProductId == dto.ProductId
            && i.Order!.UserId == userId
            && i.Order.Status != OrderStatus.CANCELLED);

        await using var tx = await db.Database.BeginTransactionAsync();

        var review = await db.Reviews
            .FirstOrDefaultAsync(r => r.ProductId == dto.ProductId && r.UserId == userId);

        if (review is null)
        {
            review = new Review { ProductId = dto.ProductId, UserId = userId };
            db.Reviews.Add(review);
        }

        review.Rating = dto.Rating;
        review.Title = dto.Title;
        review.Body = dto.Body;
        review.VerifiedPurchase = purchased;
        review.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        await RecomputeAverageAsync(dto.ProductId);
        await tx.CommitAsync();

        var saved = await db.Reviews.AsNoTracking()
            .Include(r => r.User)
            .FirstAsync(r => r.Id == review.Id);

        return ReviewView.From(saved);
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<object> Remove(int id)
    {
        var userId = User.Id() ?? throw new UnauthorizedError("Not signed in");

        var review = await db.Reviews.FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new NotFoundError("Review not found");

        if (review.UserId != userId && !User.IsAdmin())
            throw new ForbiddenError("You can only delete your own review");

        var productId = review.ProductId;

        await using var tx = await db.Database.BeginTransactionAsync();
        db.Reviews.Remove(review);
        await db.SaveChangesAsync();
        await RecomputeAverageAsync(productId);
        await tx.CommitAsync();

        return new { id };
    }

    /// <summary>
    /// Rewrites the product's cached rating and review count.
    /// </summary>
    /// <remarks>
    /// The catalogue lists dozens of products at once, so the average is stored on
    /// the product rather than aggregated on every read. That only holds while it
    /// is recomputed inside the same transaction as the write that changed it —
    /// otherwise a failure halfway leaves a star rating no review supports.
    /// </remarks>
    private async Task RecomputeAverageAsync(int productId)
    {
        var ratings = await db.Reviews
            .Where(r => r.ProductId == productId)
            .Select(r => r.Rating)
            .ToListAsync();

        await db.Products
            .Where(p => p.Id == productId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.Rating, ratings.Count == 0 ? 0 : ratings.Average())
                .SetProperty(p => p.Reviews, ratings.Count));
    }
}
