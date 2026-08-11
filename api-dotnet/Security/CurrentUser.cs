using System.Security.Claims;
using SmaFuelMarket.Api.Data;

namespace SmaFuelMarket.Api.Security;

/// <summary>
/// Reads the signed-in user out of the token the request carries.
/// </summary>
public static class CurrentUser
{
    public const string IdClaim = "sub";
    public const string RoleClaim = "role";

    /// <summary>
    /// The signed-in user's id.
    /// </summary>
    /// <remarks>
    /// The claim is parsed rather than trusted. User ids are integers, but a
    /// hand-edited token carries whatever its author liked, and handing that to
    /// the database raises a 500 on a type mismatch. A bad subject is a bad
    /// credential, so it reads as "not signed in" and the caller answers 401.
    /// </remarks>
    public static int? Id(this ClaimsPrincipal principal)
    {
        var raw = principal.FindFirstValue(IdClaim)
            ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(raw, out var id) ? id : null;
    }

    public static Role Role(this ClaimsPrincipal principal)
    {
        var raw = principal.FindFirstValue(RoleClaim) ?? principal.FindFirstValue(ClaimTypes.Role);
        return Enum.TryParse<Role>(raw, out var role) ? role : Data.Role.CUSTOMER;
    }

    public static bool IsAdmin(this ClaimsPrincipal principal) => principal.Role() == Data.Role.ADMIN;
}
