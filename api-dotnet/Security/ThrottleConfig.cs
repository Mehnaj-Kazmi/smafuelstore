using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace SmaFuelMarket.Api.Security;

/// <summary>
/// How hard a caller may hammer the sensitive routes.
/// </summary>
/// <remarks>
/// The first attempt at these was far too mean — five registrations an hour and
/// eight sign-in attempts in five minutes — which locked the developer out of
/// their own shop within a single testing session. It also punished anyone
/// legitimate: a household or an office behind one address shares an IP, so a
/// limit tuned for one person blocks the fourth colleague to sign in.
///
/// These are set where a real person could not plausibly reach them but an
/// automated attack does so immediately. Development is looser still, because the
/// only traffic there is the person building the thing.
/// </remarks>
public static class ThrottleConfig
{
    public const string Login = "login";
    public const string Register = "register";
    public const string ForgotPassword = "forgot-password";
    public const string ReviewWrite = "review-write";

    public static IServiceCollection AddShopRateLimiting(this IServiceCollection services, bool isProduction)
    {
        /* A limit that is generous locally and firm once deployed. */
        int Limit(int production, int development) => isProduction ? production : development;

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            /* Everything not named below. Browsing must never feel it. */
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                RateLimitPartition.GetFixedWindowLimiter(Caller(context), _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = Limit(300, 3_000),
                    Window = TimeSpan.FromMinutes(1),
                }));

            /* Guessing a password is the attack; mistyping one twice is not. */
            Add(options, Login, Limit(20, 500), TimeSpan.FromMinutes(5));

            /* Slows bulk account creation without blocking a real shared address. */
            Add(options, Register, Limit(20, 500), TimeSpan.FromHours(1));

            /* The tightest, because each request sends someone an email. Anyone
               asking more than a handful of times an hour is using the shop to
               pester a mailbox. */
            Add(options, ForgotPassword, Limit(8, 200), TimeSpan.FromHours(1));

            /* Enough to reconsider several opinions, not enough to rate a catalogue. */
            Add(options, ReviewWrite, Limit(40, 500), TimeSpan.FromHours(1));

            options.OnRejected = async (context, token) =>
            {
                context.HttpContext.Response.ContentType = "application/json";
                await context.HttpContext.Response.WriteAsync(
                    """{"message":"Too many requests. Please wait a moment and try again.","statusCode":429}""",
                    token);
            };
        });

        return services;
    }

    private static void Add(RateLimiterOptions options, string name, int permits, TimeSpan window) =>
        options.AddPolicy(name, context =>
            RateLimitPartition.GetFixedWindowLimiter($"{name}:{Caller(context)}", _ =>
                new FixedWindowRateLimiterOptions { PermitLimit = permits, Window = window }));

    /// <summary>
    /// Who to count against. The remote address, falling back to a shared bucket
    /// when there is none — an unidentifiable caller should be limited more, not
    /// let through unmetered.
    /// </summary>
    private static string Caller(HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString()
        ?? context.Request.Headers.Host.ToString()
        ?? CultureInfo.InvariantCulture.Name;
}
