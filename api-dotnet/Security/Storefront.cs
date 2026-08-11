namespace SmaFuelMarket.Api.Security;

/// <summary>
/// Serves the storefront's static files, and decides what to do with a URL that
/// has no file behind it.
/// </summary>
/// <remarks>
/// The site is exported as static HTML: one folder per route, each holding an
/// <c>index.html</c>. Two things still need handling.
///
/// A route requested without its trailing slash — <c>/shop</c> rather than
/// <c>/shop/</c> — matches no file, so it is resolved against the folder.
///
/// More importantly, a product added in the admin panel after the last build has
/// no folder at all. Rather than 404 something the shop is genuinely selling, the
/// request is answered with any prerendered product page. That is not a trick:
/// every product page is the same shell, because the id is read from the URL and
/// the product is fetched from this API in the browser. The customer gets the
/// right product; the only difference is that the HTML arrived generic.
/// </remarks>
public static class Storefront
{
    public static void MapStorefront(this WebApplication app, string webRoot)
    {
        /*
         * The shells that answer routes with no page of their own.
         *
         * Deliberately the pages exported under the id "_" rather than any real
         * product's: those carry a product's markup, and serving one for a
         * different product would show the wrong item for a frame before the
         * browser corrected it. The "_" pages hold nothing and read the id from
         * the address bar, so there is nothing wrong to flash.
         */
        var productShell = Path.Combine(webRoot, "product", "_", "index.html");
        var departmentShell = Path.Combine(webRoot, "department", "_", "index.html");
        var notFound = Path.Combine(webRoot, "404.html");

        app.MapFallback(async context =>
        {
            var path = context.Request.Path.Value ?? "/";

            /* The API answers for itself. Falling back to HTML here would turn a
               mistyped endpoint into a 200 with a web page, which any client
               parsing JSON reads as a far stranger failure than a 404. */
            if (path.StartsWith("/api", StringComparison.OrdinalIgnoreCase)
                || path.StartsWith("/uploads", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
            }

            /* The exported folder for this route, for a request that arrived
               without its trailing slash. */
            var direct = Path.Combine(webRoot, path.Trim('/').Replace('/', Path.DirectorySeparatorChar), "index.html");

            var file = File.Exists(direct) ? direct
                : path.StartsWith("/product/", StringComparison.OrdinalIgnoreCase) ? productShell
                : path.StartsWith("/department/", StringComparison.OrdinalIgnoreCase) ? departmentShell
                : null;

            if (file is null || !File.Exists(file))
            {
                if (File.Exists(notFound))
                {
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    context.Response.ContentType = "text/html";
                    await context.Response.SendFileAsync(notFound);
                    return;
                }

                context.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
            }

            /*
             * Not cached. The shell is what a browser would otherwise remember for
             * a URL whose real page appears at the next build, and a stale copy of
             * the wrong route is a confusing thing to have to explain to someone.
             */
            context.Response.ContentType = "text/html";
            context.Response.Headers.CacheControl = "no-cache";
            await context.Response.SendFileAsync(file);
        });
    }

}
