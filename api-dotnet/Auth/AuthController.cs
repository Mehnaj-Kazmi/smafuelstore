using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SmaFuelMarket.Api.Security;

namespace SmaFuelMarket.Api.Auth;

[ApiController]
[Route("auth")]
public class AuthController(AuthService auth) : ControllerBase
{
    /* Limits on the routes worth attacking. See ThrottleConfig for why these
       numbers, and why development is looser. */

    [EnableRateLimiting(ThrottleConfig.Register)]
    [HttpPost("register")]
    public Task<AuthResult> Register([FromBody] RegisterDto dto) => auth.RegisterAsync(dto);

    [EnableRateLimiting(ThrottleConfig.Login)]
    [HttpPost("login")]
    public Task<AuthResult> Login([FromBody] LoginDto dto) => auth.LoginAsync(dto);

    /* Both reset routes are deliberately unauthenticated — someone who cannot
       sign in is exactly who needs them. */
    [EnableRateLimiting(ThrottleConfig.ForgotPassword)]
    [HttpPost("forgot-password")]
    public Task<Dictionary<string, object>> ForgotPassword([FromBody] ForgotPasswordDto dto) =>
        auth.ForgotPasswordAsync(dto);

    /* Deliberately not throttled beyond the global default: the token is
       unguessable, and someone who mistypes a new password should never be locked
       out of the reset they were just sent. */
    [HttpPost("reset-password")]
    public Task<AuthResult> ResetPassword([FromBody] ResetPasswordDto dto) =>
        auth.ResetPasswordAsync(dto);

    [Authorize]
    [HttpGet("me")]
    public Task<UserView> Me() =>
        auth.MeAsync(User.Id() ?? throw new UnauthorizedError("Not signed in"));
}
