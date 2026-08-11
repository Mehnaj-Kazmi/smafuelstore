using System.ComponentModel.DataAnnotations;

namespace SmaFuelMarket.Api.Auth;

public class RegisterDto
{
    [Required, EmailAddress] public string Email { get; set; } = "";
    [Required, MinLength(6)] public string Password { get; set; } = "";
    [Required] public string Name { get; set; } = "";
    public string? Phone { get; set; }
}

public class LoginDto
{
    [Required, EmailAddress] public string Email { get; set; } = "";
    [Required, MinLength(6)] public string Password { get; set; } = "";
}

public class ForgotPasswordDto
{
    [Required, EmailAddress] public string Email { get; set; } = "";
}

public class ResetPasswordDto
{
    [Required] public string Token { get; set; } = "";

    /// <summary>Same minimum as registration, so a reset cannot weaken an account.</summary>
    [Required, MinLength(6)] public string Password { get; set; } = "";
}

/// <summary>The signed-in user as the storefront knows them. Deliberately not the
/// entity — a password hash has no business leaving the server.</summary>
public record UserView(int Id, string Email, string Name, string Role);

public record AuthResult(string AccessToken, UserView User);
