using Microsoft.EntityFrameworkCore;

namespace SmaFuelMarket.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<StoreLocation> StoreLocations => Set<StoreLocation>();
    public DbSet<FuelPrice> FuelPrices => Set<FuelPrice>();
    public DbSet<HeroSlide> HeroSlides => Set<HeroSlide>();
    public DbSet<ShowcaseCard> ShowcaseCards => Set<ShowcaseCard>();
    public DbSet<Deal> Deals => Set<Deal>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        /* Enums are stored as their names rather than ordinals. A number would
           silently change meaning the day a value is inserted into the middle
           of the enum, quietly reclassifying every existing row. */
        b.Entity<User>().Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
        b.Entity<Order>().Property(o => o.Status).HasConversion<string>().HasMaxLength(30);
        b.Entity<Deal>().Property(d => d.Kind).HasConversion<string>().HasMaxLength(20);

        b.Entity<User>().HasIndex(u => u.Email).IsUnique();
        b.Entity<Product>().HasIndex(p => p.Sku).IsUnique();
        b.Entity<Product>().HasIndex(p => p.Barcode).IsUnique();
        b.Entity<PasswordResetToken>().HasIndex(t => t.TokenHash).IsUnique();
        b.Entity<PasswordResetToken>().HasIndex(t => t.UserId);

        /* One review per customer per product, enforced by the database rather
           than by the code that happens to check first. */
        b.Entity<Review>().HasIndex(r => new { r.ProductId, r.UserId }).IsUnique();

        /* Deleting a customer takes their addresses, reviews and reset tokens
           with them; their orders are the shop's own trading record, so those
           are restricted and must be dealt with deliberately. */
        b.Entity<Address>()
            .HasOne(a => a.User).WithMany(u => u.Addresses)
            .HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Review>()
            .HasOne(r => r.User).WithMany(u => u.Reviews)
            .HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Review>()
            .HasOne(r => r.Product).WithMany(p => p.ProductReviews)
            .HasForeignKey(r => r.ProductId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<PasswordResetToken>()
            .HasOne(t => t.User).WithMany(u => u.PasswordResets)
            .HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Order>()
            .HasOne(o => o.User).WithMany(u => u.Orders)
            .HasForeignKey(o => o.UserId).OnDelete(DeleteBehavior.Restrict);

        b.Entity<Order>()
            .HasOne(o => o.Address).WithMany(a => a.Orders)
            .HasForeignKey(o => o.AddressId).OnDelete(DeleteBehavior.Restrict);

        b.Entity<OrderItem>()
            .HasOne(i => i.Order).WithMany(o => o.Items)
            .HasForeignKey(i => i.OrderId).OnDelete(DeleteBehavior.Cascade);

        /* A product that has been sold cannot simply vanish — the order line
           records what was bought and for how much. */
        b.Entity<OrderItem>()
            .HasOne(i => i.Product).WithMany(p => p.OrderItems)
            .HasForeignKey(i => i.ProductId).OnDelete(DeleteBehavior.Restrict);

        b.Entity<FuelPrice>()
            .HasOne(f => f.Store).WithMany(s => s.FuelPrices)
            .HasForeignKey(f => f.StoreId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Category>()
            .HasOne(c => c.Department).WithMany(d => d.Categories)
            .HasForeignKey(c => c.DepartmentSlug).OnDelete(DeleteBehavior.Restrict);

        b.Entity<Product>()
            .HasOne(p => p.Department).WithMany(d => d.Products)
            .HasForeignKey(p => p.DepartmentSlug).OnDelete(DeleteBehavior.Restrict);

        b.Entity<Product>()
            .HasOne(p => p.Category).WithMany(c => c.Products)
            .HasForeignKey(p => p.CategorySlug).OnDelete(DeleteBehavior.Restrict);

        /* A promotion can cover a bundle, and a product can appear in more than
           one promotion, so this is a genuine many-to-many. */
        b.Entity<Deal>()
            .HasMany(d => d.Products).WithMany(p => p.Deals)
            .UsingEntity(j => j.ToTable("DealProducts"));
    }
}
