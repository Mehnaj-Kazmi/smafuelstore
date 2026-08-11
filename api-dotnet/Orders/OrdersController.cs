using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmaFuelMarket.Api.Auth;
using SmaFuelMarket.Api.Data;
using SmaFuelMarket.Api.Security;

namespace SmaFuelMarket.Api.Orders;

/// <summary>Every route here needs a session — orders always belong to someone.</summary>
[ApiController]
[Route("orders")]
[Authorize]
public class OrdersController(OrdersService orders) : ControllerBase
{
    private int UserId => User.Id() ?? throw new UnauthorizedError("Not signed in");

    [HttpPost]
    public Task<OrderView> Create([FromBody] CreateOrderDto dto) => orders.CreateAsync(UserId, dto);

    /// <summary>The signed-in customer's own orders.</summary>
    [HttpGet("mine")]
    public Task<IEnumerable<OrderView>> FindMine() => orders.FindMineAsync(UserId);

    /// <summary>
    /// What this basket would cost, without placing it.
    /// </summary>
    /// <remarks>
    /// Checkout shows these figures rather than working them out again, so the
    /// summary and the receipt are produced by the same code.
    /// </remarks>
    [HttpPost("quote")]
    public Task<QuoteResult> Quote([FromBody] QuoteOrderDto dto) => orders.QuoteAsync(UserId, dto);

    /* Declared before "{id}" so "check-coupon" is not read as an order id. */
    [HttpPost("check-coupon")]
    public Task<CouponCheck> CheckCoupon([FromBody] CheckCouponDto dto) =>
        orders.CheckCouponAsync(UserId, dto.Code, dto.Subtotal);

    /* Admin views. The int route constraint already keeps "all" and "stats" from
       being read as ids, but they are declared first regardless. */
    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpGet("all")]
    public Task<IEnumerable<OrderView>> FindAll() => orders.FindAllAsync();

    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpGet("stats")]
    public Task<OrderStats> Stats() => orders.StatsAsync();

    [HttpGet("{id:int}")]
    public Task<OrderView> FindOne(int id) => orders.FindOneAsync(id, UserId, User.Role());

    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpPatch("{id:int}/status")]
    public Task<OrderView> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        if (!Enum.TryParse<OrderStatus>(dto.Status, out var status))
        {
            throw new BadRequestError(
                $"status must be one of: {string.Join(", ", Enum.GetNames<OrderStatus>())}");
        }

        return orders.UpdateStatusAsync(id, status);
    }
}
