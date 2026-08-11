namespace SmaFuelMarket.Api.Security;

/// <summary>
/// The key every session token is signed with.
/// </summary>
/// <remarks>
/// A development default is convenient but dangerous: a deploy that forgets the
/// setting would happily sign real sessions with a key committed to a public
/// repository, and anyone reading it could mint themselves an administrator.
/// So production refuses to start instead. Failing to boot is a five-minute
/// problem; booting with a known key is a silent one that ends with someone
/// else's orders.
/// </remarks>
public static class JwtSecret
{
    private const string DevFallback = "dev-only-insecure-secret-not-for-production";

    /// <summary>Minimum length in production. Shorter keys are brute-forceable
    /// offline, where no rate limit can help.</summary>
    private const int MinimumProductionLength = 32;

    public static string Resolve(IConfiguration configuration, bool isProduction)
    {
        var secret = configuration["Jwt:Secret"];

        if (!string.IsNullOrWhiteSpace(secret))
        {
            if (isProduction && secret.Length < MinimumProductionLength)
            {
                throw new InvalidOperationException(
                    $"Jwt:Secret must be at least {MinimumProductionLength} characters in production.");
            }
            return secret;
        }

        if (isProduction)
        {
            throw new InvalidOperationException(
                "Jwt:Secret is not set. Refusing to start in production with a default signing key — "
                    + "anyone who knows it could forge an administrator session.");
        }

        return DevFallback;
    }
}
