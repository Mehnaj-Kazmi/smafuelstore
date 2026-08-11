using Microsoft.EntityFrameworkCore;
using SmaFuelMarket.Api.Auth;
using SmaFuelMarket.Api.Data;

namespace SmaFuelMarket.Api.Orders;

/// <summary>Figures the admin dashboard and reports are built from.</summary>
public record StatsLineProduct(int Id, string Title, string DepartmentSlug);
public record StatsLine(int Quantity, decimal UnitPrice, StatsLineProduct Product);
public record StatsOrder(
    int Id, DateTime PlacedAt, string Status, decimal Subtotal, decimal Total,
    IReadOnlyList<StatsLine> Items);
public record OrderStats(IReadOnlyList<StatsOrder> Orders, int Customers);

public class OrdersService(AppDbContext db)
{
    /// <summary>Everything a storefront or admin view needs about an order, in one query.</summary>
    private IQueryable<Order> WithDetail() => db.Orders
        .Include(o => o.Items).ThenInclude(i => i.Product)
        .Include(o => o.Address)
        .Include(o => o.User);

    /// <summary>
    /// Prices a basket: what it costs, what the shop's promotions took off, and
    /// what a coupon adds to that.
    /// </summary>
    /// <param name="enforceStock">
    /// Order placement rejects a short basket; a quote only reports it.
    /// </param>
    /// <remarks>
    /// Shared by <see cref="QuoteAsync"/> and <see cref="CreateAsync"/> on purpose.
    /// Checkout used to compute its own totals in the browser, and the two copies
    /// had already drifted — the page judged free delivery on the discounted
    /// amount while the server judged it on the subtotal, so the figure shown and
    /// the figure charged could differ. One implementation, used by the page that
    /// displays it and the endpoint that bills it, cannot disagree with itself.
    /// </remarks>
    private async Task<(Dictionary<int, Product> ById, Totals Totals, DealBreakdown Deals)> PriceBasketAsync(
        int userId,
        IReadOnlyList<OrderLineDto> items,
        string? couponCode,
        bool enforceStock = true)
    {
        var ids = items.Select(i => i.ProductId).ToList();
        var products = await db.Products.Where(p => ids.Contains(p.Id)).ToListAsync();

        if (products.Count != ids.Distinct().Count())
            throw new BadRequestError("Your basket contains an item that no longer exists");

        var byId = products.ToDictionary(p => p.Id);

        foreach (var line in items)
        {
            if (!byId.TryGetValue(line.ProductId, out var product))
                throw new BadRequestError("Unknown product in basket");

            if (enforceStock && product.Stock < line.Quantity)
                throw new BadRequestError($"{product.Title} only has {product.Stock} left");
        }

        var subtotal = items.Sum(line => byId[line.ProductId].Price * line.Quantity);

        /* Promotions are applied to the basket without the customer asking, which
           is the whole point of advertising them on the shelf. */
        var lines = items
            .Select(line => new PricingLine(line.ProductId, line.Quantity, byId[line.ProductId].Price))
            .ToList();

        var deals = DealPricing.PriceDeals(lines, await ActiveDealsForAsync(ids));

        var totals = Pricing.PriceOrder(
            subtotal, couponCode, await MayRedeemAsync(userId, couponCode), deals.Total);

        return (byId, totals, deals);
    }

    /// <summary>Prices a basket without placing it, so checkout shows what will be charged.</summary>
    public async Task<QuoteResult> QuoteAsync(int userId, QuoteOrderDto dto)
    {
        var (_, totals, deals) = await PriceBasketAsync(userId, dto.Items, dto.CouponCode, enforceStock: false);

        return new QuoteResult(
            totals.Subtotal, totals.DealDiscount, totals.Discount,
            totals.DeliveryFee, totals.Tax, totals.Total, totals.CouponCode,
            deals.Lines);
    }

    /// <summary>
    /// Places an order.
    /// </summary>
    /// <remarks>
    /// Prices, discounts and totals are read from the database and recalculated
    /// here — never taken from the request. The browser sends product ids and
    /// quantities only, so a tampered payload cannot set its own price.
    ///
    /// The whole thing runs in one transaction: if any line is out of stock the
    /// order is not written and no stock is taken. Otherwise a customer could end
    /// up with a half-fulfilled order and the shop with wrong inventory.
    /// </remarks>
    public async Task<OrderView> CreateAsync(int userId, CreateOrderDto dto)
    {
        var (byId, totals, _) = await PriceBasketAsync(userId, dto.Items, dto.CouponCode);

        await using var tx = await db.Database.BeginTransactionAsync();

        /*
         * Stock is taken first, before anything is written.
         *
         * The friendly check in PriceBasketAsync is not authoritative: two orders
         * placed at the same moment both pass it while stock is still whole, and
         * an unconditional decrement then takes the same unit twice — sold four of
         * three, stock left at minus one.
         *
         * So the guarantee is here: an UPDATE filtered on there still being enough
         * left makes the test and the decrement one statement, which the database
         * serialises per row. Losing that race matches no rows, and throwing rolls
         * the transaction back.
         *
         * Two details matter on MySQL specifically. Taking stock *before* writing
         * the order means a losing transaction has taken no other locks to unwind,
         * and the lines are sorted by product id so that concurrent orders sharing
         * products always lock those rows in the same sequence. Written the other
         * way round — order first, stock last, lines in cart order — InnoDB
         * deadlocks under concurrency and customers see a 500 rather than an
         * honest "sold out".
         */
        foreach (var line in dto.Items.OrderBy(i => i.ProductId))
        {
            var taken = await db.Products
                .Where(p => p.Id == line.ProductId && p.Stock >= line.Quantity)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.Stock, p => p.Stock - line.Quantity));

            if (taken == 0)
            {
                var title = byId.TryGetValue(line.ProductId, out var short_) ? short_.Title : "An item";
                throw new BadRequestError($"{title} sold out while you were checking out");
            }
        }

        var address = new Address
        {
            UserId = userId,
            Label = "Delivery",
            Recipient = dto.Address.Recipient,
            Line1 = dto.Address.Line1,
            City = dto.Address.City,
            Zip = dto.Address.Zip,
            Notes = string.IsNullOrWhiteSpace(dto.Address.Notes) ? null : dto.Address.Notes,
        };
        db.Addresses.Add(address);
        await db.SaveChangesAsync();

        var order = new Order
        {
            UserId = userId,
            AddressId = address.Id,
            Subtotal = totals.Subtotal,
            DealDiscount = totals.DealDiscount,
            Discount = totals.Discount,
            DeliveryFee = totals.DeliveryFee,
            Tax = totals.Tax,
            Total = totals.Total,
            CouponCode = totals.CouponCode,
            Status = OrderStatus.PENDING,
            Items = dto.Items.Select(line => new OrderItem
            {
                ProductId = line.ProductId,
                Quantity = line.Quantity,
                UnitPrice = byId[line.ProductId].Price,
            }).ToList(),
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        await tx.CommitAsync();

        var saved = await WithDetail().AsNoTracking().FirstAsync(o => o.Id == order.Id);
        return OrderView.From(saved);
    }

    /// <summary>
    /// The live promotions covering any of these products.
    /// </summary>
    /// <remarks>
    /// Only <c>Active</c> decides whether a promotion is running. <c>EndsInHours</c>
    /// drives the countdown badge on the storefront, but the admin panel ends a
    /// deal with its End button, which clears <c>Active</c> — treating the
    /// countdown as authoritative here would silently stop honouring a deal the
    /// shop still shows as live, which is the mismatch this whole thing exists to
    /// remove.
    /// </remarks>
    private async Task<List<PricingDeal>> ActiveDealsForAsync(List<int> productIds)
    {
        var deals = await db.Deals
            .Include(d => d.Products)
            .Where(d => d.Active && d.Products.Any(p => productIds.Contains(p.Id)))
            .AsNoTracking()
            .ToListAsync();

        return deals
            .Select(d => new PricingDeal(
                d.Id, d.Kind.ToString(), d.Title, d.PercentOff, d.Products.Select(p => p.Id).ToList()))
            .ToList();
    }

    /// <summary>
    /// Whether this customer may still redeem this code.
    /// </summary>
    /// <remarks>
    /// Judged from orders they have actually placed rather than from anything the
    /// browser sends, and cancelled orders are ignored so a cancellation does not
    /// burn a one-time offer. An unknown code answers true and is then discarded
    /// by the pricing rules, which keeps "no such coupon" and "already used" from
    /// needing different handling here.
    /// </remarks>
    private async Task<bool> MayRedeemAsync(int userId, string? code)
    {
        var coupon = Pricing.FindCoupon(code);
        if (coupon is null || coupon.Redemption == Redemption.Unlimited) return true;

        if (coupon.Redemption == Redemption.FirstOrder)
        {
            return !await db.Orders.AnyAsync(o =>
                o.UserId == userId && o.Status != OrderStatus.CANCELLED);
        }

        return !await db.Orders.AnyAsync(o =>
            o.UserId == userId && o.CouponCode == coupon.Code && o.Status != OrderStatus.CANCELLED);
    }

    /// <summary>
    /// Answers whether this customer can use a code, before they commit to it.
    /// </summary>
    /// <remarks>
    /// The storefront cannot work this out on its own — redemption depends on
    /// order history it does not hold — and showing a discount that the order
    /// endpoint then refuses reads as the shop breaking its promise. So checkout
    /// asks here and reports the same answer the order will act on.
    /// </remarks>
    public async Task<CouponCheck> CheckCouponAsync(int userId, string code, decimal subtotal)
    {
        var coupon = Pricing.FindCoupon(code);
        if (coupon is null)
            return new CouponCheck(false, "That code isn't recognised", null, null, null);

        if (coupon.MinSpend is not null && subtotal < coupon.MinSpend)
            return new CouponCheck(false, $"Spend ${coupon.MinSpend:F2} to use this code", null, null, null);

        if (!await MayRedeemAsync(userId, coupon.Code))
        {
            return new CouponCheck(false,
                coupon.Redemption == Redemption.FirstOrder
                    ? "This code is for your first order"
                    : "You've already used this code",
                null, null, null);
        }

        var totals = Pricing.PriceOrder(subtotal, coupon.Code, redeemable: true);
        return new CouponCheck(true, null, coupon.Code, coupon.Description, totals.Discount);
    }

    /// <summary>A customer's own orders, newest first.</summary>
    public async Task<IEnumerable<OrderView>> FindMineAsync(int userId)
    {
        var rows = await WithDetail().AsNoTracking()
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.PlacedAt)
            .ToListAsync();
        return rows.Select(OrderView.From);
    }

    /// <summary>Every order in the shop — admin only.</summary>
    public async Task<IEnumerable<OrderView>> FindAllAsync()
    {
        var rows = await WithDetail().AsNoTracking()
            .OrderByDescending(o => o.PlacedAt)
            .ToListAsync();
        return rows.Select(OrderView.From);
    }

    /// <summary>
    /// One order. A customer may only read their own; an admin may read any, so
    /// order ids cannot be walked to read other people's addresses.
    /// </summary>
    public async Task<OrderView> FindOneAsync(int id, int userId, Role role)
    {
        var order = await WithDetail().AsNoTracking().FirstOrDefaultAsync(o => o.Id == id);

        /* The same "not found" for someone else's order as for one that does not
           exist. A 403 here would confirm the order is real, which is exactly what
           walking ids is trying to learn. */
        if (order is null || (role != Role.ADMIN && order.UserId != userId))
            throw new NotFoundError($"Order {id} not found");

        return OrderView.From(order);
    }

    public async Task<OrderView> UpdateStatusAsync(int id, OrderStatus status)
    {
        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id)
            ?? throw new NotFoundError($"Order {id} not found");

        await using var tx = await db.Database.BeginTransactionAsync();

        /* Cancelling releases the stock the order was holding, so a cancelled
           order does not quietly keep items out of the shop. Guarded on the order
           not already being cancelled, so cancelling twice does not put the stock
           back twice. */
        if (status == OrderStatus.CANCELLED && order.Status != OrderStatus.CANCELLED)
        {
            foreach (var item in order.Items)
            {
                await db.Products
                    .Where(p => p.Id == item.ProductId)
                    .ExecuteUpdateAsync(s => s.SetProperty(p => p.Stock, p => p.Stock + item.Quantity));
            }
        }

        order.Status = status;
        await db.SaveChangesAsync();
        await tx.CommitAsync();

        var saved = await WithDetail().AsNoTracking().FirstAsync(o => o.Id == id);
        return OrderView.From(saved);
    }

    /// <summary>Figures the admin dashboard and reports are built from.</summary>
    public async Task<OrderStats> StatsAsync()
    {
        var orders = await db.Orders.AsNoTracking()
            .Include(o => o.Items).ThenInclude(i => i.Product)
            .Where(o => o.Status != OrderStatus.CANCELLED)
            .OrderByDescending(o => o.PlacedAt)
            .ToListAsync();

        var customers = await db.Users.CountAsync(u => u.Role == Role.CUSTOMER);

        return new OrderStats(
            orders.Select(o => new StatsOrder(
                o.Id, o.PlacedAt, o.Status.ToString(), o.Subtotal, o.Total,
                o.Items.Select(i => new StatsLine(
                    i.Quantity, i.UnitPrice,
                    new StatsLineProduct(
                        i.ProductId,
                        i.Product?.Title ?? "",
                        i.Product?.DepartmentSlug ?? ""))).ToList())).ToList(),
            customers);
    }
}
