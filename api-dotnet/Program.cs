using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using SmaFuelMarket.Api.Auth;
using SmaFuelMarket.Api.Data;
using SmaFuelMarket.Api.Mail;
using SmaFuelMarket.Api.Orders;
using SmaFuelMarket.Api.Security;
using SmaFuelMarket.Api.Uploads;

var builder = WebApplication.CreateBuilder(args);

/*
 * MySQL rather than PostgreSQL, because the shop is deployed to Windows hosting
 * that offers no Postgres. The schema is otherwise the same one the Node API
 * used, so the storefront cannot tell the difference.
 */
var connectionString =
    builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException(
        "ConnectionStrings:Default is not set. Copy appsettings.Development.json and fill it in.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySQL(connectionString));

/*
 * The signing key is resolved once, and production refuses to start without a
 * real one — a default key in a public repository would let anyone mint an
 * administrator token. Same rule the Node API settled on.
 */
var jwtSecret = JwtSecret.Resolve(builder.Configuration, builder.Environment.IsProduction());

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        /* Keep the claim names the token actually carries. Left on, the handler
           rewrites `sub` and `role` into long SOAP-era URIs, and every lookup by
           the name we issued comes back empty. */
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            /* No grace period on expiry. The default five minutes silently
               extends every token's life beyond what it says. */
            ClockSkew = TimeSpan.Zero,
            NameClaimType = CurrentUser.IdClaim,
            RoleClaimType = CurrentUser.RoleClaim,
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddShopRateLimiting(builder.Environment.IsProduction());

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<MailService>();
builder.Services.AddScoped<OrdersService>();
builder.Services.AddSingleton<UploadsPath>();

/* Every controller answers under /api, matching the Node API the storefront was
   written against — NEXT_PUBLIC_API_URL already ends in /api. Applied as a
   convention rather than typed into each [Route] so it cannot be forgotten on a
   controller added later. */
builder.Services.AddControllers(options => options.UseRoutePrefix("api"));

/*
 * Which browser origins may call this API.
 *
 * A comma-separated list, because one is never quite enough: the storefront,
 * a second copy on another port, and the machine's network address when the
 * site is opened from a phone. Production allows exactly what it is told.
 */
var allowed = (builder.Configuration["FrontendUrl"] ?? "http://localhost:3000")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowed).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

/* Security headers. IIS adds none of these on its own. */
app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "SAMEORIGIN";
    headers["Referrer-Policy"] = "no-referrer";
    await next();
});

app.UseShopErrorHandling();
app.UseCors();

/* The storefront itself: the exported static site, served from wwwroot so the
   shop and its API share one deployment and one origin. */
app.UseDefaultFiles();
app.UseStaticFiles();

/*
 * Uploaded product photographs, served straight from disk.
 *
 * Mounted outside the /api prefix on purpose — the prefix applies to controllers,
 * not to static files, so these stay at /uploads/<file>. The upload endpoint
 * returns that same path, so the two must agree.
 */
var uploadsPath = app.Services.GetRequiredService<UploadsPath>();
Directory.CreateDirectory(uploadsPath.Directory);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath.Directory),
    RequestPath = "/uploads",
    OnPrepareResponse = ctx =>
    {
        /*
         * A short freshness window rather than the year an immutable asset would
         * get. Filenames are unique per upload, so caching hard would normally be
         * safe — but images can be rewritten in place, since the upload endpoint
         * normalises backgrounds, and a year-long cache means browsers keep
         * showing the old version of a path they have already seen with no request
         * to discover otherwise. Five minutes plus the ETag the static file
         * middleware sends means repeat views still hit cache and a changed image
         * corrects itself, cheaply, on its own.
         */
        ctx.Context.Response.Headers.CacheControl = "public,max-age=300";
    },
});
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

/* Proves the process is up and the database is reachable, which is the first
   thing worth knowing after a deploy to shared hosting. */
app.MapGet("/api/health", async (AppDbContext db) =>
{
    var canConnect = await db.Database.CanConnectAsync();
    return Results.Ok(new { status = canConnect ? "ok" : "degraded", database = canConnect });
});

/* Registered last, so it only sees requests nothing else claimed. */
app.MapStorefront(app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot"));

app.Run();
