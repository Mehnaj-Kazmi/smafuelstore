using SmaFuelMarket.Api.Auth;

namespace SmaFuelMarket.Api.Security;

/// <summary>
/// Turns the services' domain errors into the JSON shape the storefront already
/// reads.
/// </summary>
/// <remarks>
/// Nest replied <c>{ message, statusCode }</c> and the frontend surfaces
/// <c>message</c> directly to the customer, so keeping that shape means no page
/// has to change to move onto this API.
///
/// Anything not recognised answers a flat 500 with a generic message. An
/// unexpected exception's text can name a table, a column or a file path, and
/// none of that is a customer's business — the detail goes to the log instead.
/// </remarks>
public static class ErrorHandling
{
    public static IApplicationBuilder UseShopErrorHandling(this IApplicationBuilder app) =>
        app.Use(async (context, next) =>
        {
            try
            {
                await next();
            }
            catch (Exception ex)
            {
                var (status, message) = ex switch
                {
                    BadRequestError => (StatusCodes.Status400BadRequest, ex.Message),
                    UnauthorizedError => (StatusCodes.Status401Unauthorized, ex.Message),
                    ForbiddenError => (StatusCodes.Status403Forbidden, ex.Message),
                    NotFoundError => (StatusCodes.Status404NotFound, ex.Message),
                    ConflictError => (StatusCodes.Status409Conflict, ex.Message),
                    _ => (StatusCodes.Status500InternalServerError, "Something went wrong."),
                };

                if (status == StatusCodes.Status500InternalServerError)
                {
                    context.RequestServices
                        .GetRequiredService<ILoggerFactory>()
                        .CreateLogger("Unhandled")
                        .LogError(ex, "Unhandled error on {Method} {Path}",
                            context.Request.Method, context.Request.Path);
                }

                if (context.Response.HasStarted) throw;

                context.Response.Clear();
                context.Response.StatusCode = status;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new { message, statusCode = status });
            }
        });
}
