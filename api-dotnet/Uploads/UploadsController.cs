using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmaFuelMarket.Api.Auth;
using SmaFuelMarket.Api.Data;

namespace SmaFuelMarket.Api.Uploads;

public record LibraryItem(string Url, long Size, DateTime Modified);
public record UploadResult(string Url, long Size, string Normalised);

/// <summary>
/// Where uploaded photographs live on disk.
/// </summary>
/// <remarks>
/// Deliberately outside the published application folder by default. On IIS a
/// redeploy replaces the site directory wholesale, and photographs kept inside it
/// would be wiped by a routine deployment — the one failure this whole move was
/// meant to avoid.
/// </remarks>
public class UploadsPath(IConfiguration config, IWebHostEnvironment env)
{
    public string Directory { get; } = Path.GetFullPath(
        config["Uploads:Directory"] ?? Path.Combine(env.ContentRootPath, "uploads"));
}

[ApiController]
[Route("uploads")]
[Authorize(Roles = nameof(Role.ADMIN))]
public class UploadsController(UploadsPath uploads, ILogger<UploadsController> logger) : ControllerBase
{
    /// <summary>Only these are accepted — the extension is derived from the content type.</summary>
    private static readonly Dictionary<string, string> Allowed = new()
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp",
        ["image/avif"] = ".avif",
        ["image/gif"] = ".gif",
    };

    private const long MaxBytes = 5 * 1024 * 1024;

    /// <summary>
    /// Every photograph already sitting in the uploads folder, newest first.
    /// </summary>
    /// <remarks>
    /// A file on disk outlives the row that pointed at it — a product deleted or a
    /// database rebuilt leaves the image orphaned but perfectly good. This lets the
    /// admin re-attach one by picking it, rather than having to find the original
    /// file again on whatever machine it was uploaded from.
    /// </remarks>
    [HttpGet("library")]
    public IEnumerable<LibraryItem> Library()
    {
        if (!Directory.Exists(uploads.Directory)) return [];

        var servable = Allowed.Values.ToHashSet();

        return new DirectoryInfo(uploads.Directory)
            .EnumerateFiles()
            .Where(f => servable.Contains(f.Extension.ToLowerInvariant()))
            .Select(f => new LibraryItem($"/uploads/{f.Name}", f.Length, f.LastWriteTimeUtc))
            .OrderByDescending(f => f.Modified)
            .ToList();
    }

    /// <summary>
    /// Accepts one product photograph and returns the public path to store on the
    /// product.
    /// </summary>
    /// <param name="mode">
    /// Two destinations need opposite treatment, so the caller says which.
    /// <c>white</c> (the default) is a catalogue photograph, which sits on a white
    /// card. <c>cutout</c> is artwork for a hero tile or showcase card, which sits
    /// on a coloured panel — a white rectangle there reads as a sticker stuck onto
    /// the slide rather than as the product.
    /// </param>
    /// <remarks>
    /// The stored filename is generated rather than taken from the upload. A
    /// client-supplied name is untrusted input: it can carry path separators to
    /// escape the uploads folder, or a double extension that gets served back as
    /// something executable. Generating the name from random bytes and choosing
    /// the extension from the declared content type removes both problems, and the
    /// originals are not needed for anything.
    /// </remarks>
    [HttpPost("product-image")]
    [RequestSizeLimit(MaxBytes)]
    public async Task<UploadResult> UploadProductImage(IFormFile? file, [FromQuery] string? mode)
    {
        if (file is null || file.Length == 0)
            throw new BadRequestError("No file was received");

        if (file.Length > MaxBytes)
            throw new BadRequestError("Images must be 5 MB or smaller");

        if (!Allowed.TryGetValue(file.ContentType, out var extension))
            throw new BadRequestError("Only JPG, PNG, WebP, AVIF or GIF images are allowed");

        Directory.CreateDirectory(uploads.Directory);

        var name = $"{DateTime.UtcNow.Ticks:x}-{Convert.ToHexString(RandomNumberGenerator.GetBytes(8)).ToLowerInvariant()}{extension}";
        var source = Path.Combine(uploads.Directory, name);

        await using (var stream = System.IO.File.Create(source))
        {
            await file.CopyToAsync(stream);
        }

        /*
         * Backgrounds are baked in at upload rather than at render time, because a
         * background is opaque pixels once uploaded and CSS cannot reach it.
         *
         * A failure here is deliberately not fatal: the upload already succeeded,
         * and an unprocessed photo is worth far more to the shop than a rejected
         * one, so the file is kept as it arrived and the reason is returned for
         * the admin to see.
         */
        var url = $"/uploads/{name}";
        var normalised = "left as uploaded";

        try
        {
            if (mode == "cutout")
            {
                /* Alpha needs a PNG container, so the cut-out is a new file and the
                   original is removed once it has been replaced. */
                var pngName = Path.ChangeExtension(name, ".png");
                var target = Path.Combine(uploads.Directory, pngName);
                var result = NormaliseImage.CutOutBackdrop(source, target);

                if (result.Changed)
                {
                    url = $"/uploads/{pngName}";
                    normalised = result.Reason;
                    if (pngName != name) System.IO.File.Delete(source);
                }
                else
                {
                    /* Not separable — fall back to a white backdrop, which at least
                       looks deliberate rather than leaving whatever it arrived with. */
                    var fallback = NormaliseImage.NormaliseToWhite(source);
                    normalised = fallback.Changed
                        ? $"{result.Reason}; used a white background instead"
                        : result.Reason;
                }
            }
            else
            {
                normalised = NormaliseImage.NormaliseToWhite(source).Reason;
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning("Could not process {Name}: {Reason}", name, ex.Message);
        }

        return new UploadResult(url, file.Length, normalised);
    }
}
