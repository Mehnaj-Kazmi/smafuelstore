using System.Net;
using System.Net.Mail;
using System.Text;
using System.Text.Json;

namespace SmaFuelMarket.Api.Mail;

/// <summary>
/// The outcome of trying to send a message. <paramref name="Reason"/> carries why
/// a message did not go, so the caller can say something useful rather than
/// silently pretending it was delivered.
/// </summary>
public record SendResult(bool Delivered, string? Reason = null);

/// <summary>
/// Sends the shop's transactional email.
/// </summary>
/// <remarks>
/// Two transports, tried in order. Resend goes out over plain HTTPS, which is the
/// one that works on shared Windows hosting where outbound SMTP ports are usually
/// blocked — the reason it is preferred. SMTP is the fallback for anyone who would
/// rather point this at their own mail server.
///
/// If neither is configured the message is logged instead of thrown away, so a
/// development machine with no mail set up still shows what would have been sent.
/// </remarks>
public class MailService(IConfiguration config, ILogger<MailService> logger)
{
    private string From => config["Mail:From"] ?? "SMA Fuel & Market <no-reply@smafuel.market>";

    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(15) };

    /// <summary>
    /// Gmail prints App Passwords in four blocks for legibility; the spaces are
    /// not part of the password, and pasting them verbatim is the most common
    /// reason a correct password is rejected.
    /// </summary>
    private static string AppPassword(string raw) => raw.Replace(" ", "");

    public async Task<SendResult> SendAsync(string to, string subject, string html, string text)
    {
        var resendKey = config["Mail:ResendApiKey"]?.Trim();
        if (!string.IsNullOrEmpty(resendKey))
        {
            try
            {
                return await SendViaResendAsync(resendKey, to, subject, html, text);
            }
            catch (Exception ex)
            {
                logger.LogWarning("Email to {To} failed over Resend: {Reason}", to, ex.Message);
                return new SendResult(false, ExplainResend(ex.Message));
            }
        }

        var host = config["Mail:SmtpHost"]?.Trim();
        if (!string.IsNullOrEmpty(host))
        {
            try
            {
                return await SendViaSmtpAsync(host, to, subject, html, text);
            }
            catch (Exception ex)
            {
                logger.LogWarning("Email to {To} failed over SMTP: {Reason}", to, ex.Message);
                return new SendResult(false, ex.Message);
            }
        }

        /* Nothing configured. Logging the body means a developer can still finish
           the flow, and makes the missing configuration obvious rather than
           looking like a message that vanished. */
        logger.LogInformation("No mail transport configured. Message to {To} was not sent:\n{Text}", to, text);
        return new SendResult(false, "No mail transport is configured.");
    }

    private async Task<SendResult> SendViaResendAsync(
        string apiKey, string to, string subject, string html, string text)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Add("Authorization", $"Bearer {apiKey}");
        request.Content = new StringContent(
            JsonSerializer.Serialize(new { from = From, to = new[] { to }, subject, html, text }),
            Encoding.UTF8,
            "application/json");

        using var response = await Http.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Resend replied {(int)response.StatusCode}: {body}");
        }

        logger.LogInformation("Email sent to {To} via Resend", to);
        return new SendResult(true);
    }

    private async Task<SendResult> SendViaSmtpAsync(
        string host, string to, string subject, string html, string text)
    {
        var port = int.TryParse(config["Mail:SmtpPort"], out var p) ? p : 587;
        var user = config["Mail:SmtpUser"]?.Trim();
        var pass = config["Mail:SmtpPass"];

        if (!string.IsNullOrEmpty(user) && string.IsNullOrWhiteSpace(pass))
        {
            throw new InvalidOperationException(
                $"Mail:SmtpUser is set to {user} but Mail:SmtpPass is empty, so email cannot be sent.");
        }

        using var client = new SmtpClient(host, port)
        {
            /* Port 465 speaks TLS from the first byte, which SmtpClient cannot do;
               587 upgrades with STARTTLS, which it can. */
            EnableSsl = port != 25,
        };

        if (!string.IsNullOrEmpty(user))
        {
            client.Credentials = new NetworkCredential(user, AppPassword(pass!));
        }

        using var message = new MailMessage
        {
            From = ParseFrom(From),
            Subject = subject,
            Body = text,
            IsBodyHtml = false,
        };
        message.To.Add(to);
        message.AlternateViews.Add(
            AlternateView.CreateAlternateViewFromString(html, Encoding.UTF8, "text/html"));

        await client.SendMailAsync(message);
        logger.LogInformation("Email sent to {To} via SMTP at {Host}:{Port}", to, host, port);
        return new SendResult(true);
    }

    /// <summary>Accepts both <c>Name &lt;addr&gt;</c> and a bare address.</summary>
    private static MailAddress ParseFrom(string from)
    {
        try { return new MailAddress(from); }
        catch (FormatException) { return new MailAddress("no-reply@smafuel.market", "SMA Fuel & Market"); }
    }

    /// <summary>
    /// Turns Resend's terse rejections into something actionable.
    /// </summary>
    /// <remarks>
    /// The common one is sending from a domain that was added to Resend but never
    /// verified — the API says only "domain is not verified", which reads like a
    /// bug rather than a five-minute DNS job.
    /// </remarks>
    private static string ExplainResend(string reason)
    {
        if (reason.Contains("not verified", StringComparison.OrdinalIgnoreCase)
            || reason.Contains("domain", StringComparison.OrdinalIgnoreCase))
        {
            return reason
                + " — the sending domain in Mail:From must be verified in Resend, "
                + "or use onboarding@resend.dev while testing.";
        }

        if (reason.Contains("401") || reason.Contains("403"))
        {
            return reason + " — the Resend API key was rejected. It may have been revoked.";
        }

        return reason;
    }

    /// <summary>The reset-link email. Kept here so the wording lives with the transport.</summary>
    public Task<SendResult> SendPasswordResetAsync(string to, string name, string link)
    {
        const string subject = "Reset your SMA Fuel & Market password";

        var text = string.Join('\n',
        [
            $"Hi {name},",
            "",
            "Use the link below to choose a new password. It works once and expires in one hour.",
            "",
            link,
            "",
            "If you didn't ask for this, you can ignore this email — your password stays as it is.",
            "",
            "SMA Fuel & Market",
        ]);

        var html = $$"""
<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#0b0b0d;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#e8e8ea">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#15151a;border:1px solid #2a2a31;border-radius:16px">
      <tr><td style="padding:28px">
        <p style="margin:0 0 4px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#00b04f">SMA Fuel &amp; Market</p>
        <h1 style="margin:0 0 14px;font-size:22px;color:#fff">Reset your password</h1>
        <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#b8b8c0">
          Hi {{name}}, use the button below to choose a new password. It works once and expires in one hour.
        </p>
        <p style="margin:0 0 22px">
          <a href="{{link}}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#00b04f;color:#fff;font-size:14px;font-weight:700;text-decoration:none">Choose a new password</a>
        </p>
        <p style="margin:0 0 6px;font-size:12px;color:#8a8a93">Or paste this link into your browser:</p>
        <p style="margin:0 0 22px;font-size:12px;word-break:break-all"><a href="{{link}}" style="color:#00b04f">{{link}}</a></p>
        <p style="margin:0;padding-top:18px;border-top:1px solid #2a2a31;font-size:12px;line-height:20px;color:#8a8a93">
          If you didn&rsquo;t ask for this, you can ignore this email &mdash; your password stays as it is.
        </p>
      </td></tr>
    </table>
  </body>
</html>
""";

        return SendAsync(to, subject, html, text);
    }
}
