using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmaFuelMarket.Api.Data;
using SmaFuelMarket.Api.Mail;
using SmaFuelMarket.Api.Security;

namespace SmaFuelMarket.Api.Auth;

/// <summary>Raised for a request the caller got wrong; the controller turns it into a 400.</summary>
public class BadRequestError(string message) : Exception(message);

/// <summary>Raised when credentials do not check out; the controller turns it into a 401.</summary>
public class UnauthorizedError(string message) : Exception(message);

/// <summary>Raised when something already exists; the controller turns it into a 409.</summary>
public class ConflictError(string message) : Exception(message);

/// <summary>Raised when nothing matches; the controller turns it into a 404.</summary>
public class NotFoundError(string message) : Exception(message);

/// <summary>
/// Raised when the caller is who they say but still may not do this; the
/// controller turns it into a 403. Distinct from <see cref="UnauthorizedError"/>,
/// which means "sign in" — signing in again would not help here.
/// </summary>
public class ForbiddenError(string message) : Exception(message);

public class AuthService(
    AppDbContext db,
    IConfiguration config,
    IWebHostEnvironment env,
    MailService mail,
    ILogger<AuthService> logger)
{
    /// <summary>How long a reset link stays usable. Short, because it is emailed in plain text.</summary>
    private static readonly TimeSpan ResetTtl = TimeSpan.FromHours(1);

    /// <summary>How long a session lasts before the customer signs in again.</summary>
    private static readonly TimeSpan TokenTtl = TimeSpan.FromDays(7);

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();

    private AuthResult ToToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(JwtSecret.Resolve(config, env.IsProduction())));

        var token = new JwtSecurityToken(
            claims:
            [
                new Claim(CurrentUser.IdClaim, user.Id.ToString()),
                new Claim("email", user.Email),
                new Claim(CurrentUser.RoleClaim, user.Role.ToString()),
            ],
            expires: DateTime.UtcNow.Add(TokenTtl),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new AuthResult(
            new JwtSecurityTokenHandler().WriteToken(token),
            new UserView(user.Id, user.Email, user.Name, user.Role.ToString()));
    }

    public async Task<AuthResult> RegisterAsync(RegisterDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        if (await db.Users.AnyAsync(u => u.Email == email))
            throw new ConflictError("An account with this email already exists");

        var user = new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, 10),
            Name = dto.Name.Trim(),
            Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim(),
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return ToToken(user);
    }

    public async Task<AuthResult> LoginAsync(LoginDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);

        /* One message for both failures, so the wording cannot be used to work out
           which addresses have accounts here. */
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedError("Invalid email or password");

        return ToToken(user);
    }

    /// <summary>
    /// Starts a password reset.
    /// </summary>
    /// <remarks>
    /// The reply is the same whether or not the address has an account. Answering
    /// "no such user" would turn this endpoint into a way to test which email
    /// addresses are registered here, which is worth more to an attacker than the
    /// convenience is worth to a customer who mistyped their address.
    ///
    /// Any earlier unused tokens for the account are spent first, so a forwarded
    /// or screenshotted older link stops working as soon as a new one is asked for.
    /// </remarks>
    public async Task<Dictionary<string, object>> ForgotPasswordAsync(ForgotPasswordDto dto)
    {
        var generic = new Dictionary<string, object>
        {
            ["message"] = "If that email has an account, a reset link is on its way.",
        };

        var email = dto.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null) return generic;

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();

        await using (var tx = await db.Database.BeginTransactionAsync())
        {
            var now = DateTime.UtcNow;
            await db.PasswordResetTokens
                .Where(t => t.UserId == user.Id && t.UsedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.UsedAt, now));

            db.PasswordResetTokens.Add(new PasswordResetToken
            {
                UserId = user.Id,
                TokenHash = HashToken(token),
                ExpiresAt = now.Add(ResetTtl),
            });
            await db.SaveChangesAsync();
            await tx.CommitAsync();
        }

        var frontend = (config["FrontendUrl"] ?? "http://localhost:3000")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .First();
        var link = $"{frontend}/reset-password?token={token}";

        var sent = await mail.SendPasswordResetAsync(user.Email, user.Name, link);

        if (env.IsProduction()) return generic;

        /*
         * Outside production the link is handed back, but only when the email did
         * not go. It exists so development is not blocked by unconfigured mail —
         * once a message has actually been delivered the inbox is the way in, like
         * it is in production, and printing a live reset token nobody needs is
         * worth avoiding on its own.
         */
        if (sent.Delivered)
        {
            generic["devMailDelivered"] = true;
            return generic;
        }

        generic["devResetLink"] = link;
        generic["devMailDelivered"] = false;
        if (sent.Reason is not null) generic["devMailReason"] = sent.Reason;
        return generic;
    }

    /// <summary>Completes a reset. The token must exist, be unspent, and be in date.</summary>
    public async Task<AuthResult> ResetPasswordAsync(ResetPasswordDto dto)
    {
        /* One message for every failure mode, so the wording cannot tell a caller
           whether a token was wrong, already spent, or merely out of date. */
        const string rejection = "That reset link is invalid or has expired";

        var record = await db.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.TokenHash == HashToken(dto.Token));

        if (record is null || record.UsedAt is not null || record.ExpiresAt < DateTime.UtcNow)
            throw new BadRequestError(rejection);

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, 10);

        await using var tx = await db.Database.BeginTransactionAsync();

        /* Marked used inside the transaction and filtered on `UsedAt == null`, so
           two requests racing the same link cannot both reset the password. */
        var spent = await db.PasswordResetTokens
            .Where(t => t.Id == record.Id && t.UsedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.UsedAt, DateTime.UtcNow));

        if (spent == 0) throw new BadRequestError(rejection);

        await db.Users
            .Where(u => u.Id == record.UserId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.PasswordHash, passwordHash)
                .SetProperty(u => u.UpdatedAt, DateTime.UtcNow));

        await tx.CommitAsync();

        var user = await db.Users.AsNoTracking().FirstAsync(u => u.Id == record.UserId);
        logger.LogInformation("Password reset completed for user {UserId}", user.Id);

        /* Signed straight in — the reset already proved control of the mailbox, and
           bouncing to a login form here just invites a second password prompt. */
        return ToToken(user);
    }

    public async Task<UserView> MeAsync(int userId)
    {
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new UnauthorizedError("Not signed in");
        return new UserView(user.Id, user.Email, user.Name, user.Role.ToString());
    }
}
