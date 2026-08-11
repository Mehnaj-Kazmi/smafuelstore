using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace SmaFuelMarket.Api.Uploads;

public record NormaliseResult(bool Changed, string Reason, Rgb24? Backdrop = null);

/// <summary>
/// Puts uploaded product photographs onto a consistent background.
/// </summary>
/// <remarks>
/// Ported from the Node original pixel for pixel, including its thresholds — the
/// existing catalogue was processed with those numbers, and a newly uploaded
/// photo that came out differently would stand out on the shelf beside them.
/// </remarks>
public static class NormaliseImage
{
    /// <summary>How far a pixel may differ from the sampled backdrop and still count as it.</summary>
    private const double ColourTolerance = 34;

    /// <summary>
    /// Share of the centre of the frame that may be filled before the result is
    /// discarded.
    /// </summary>
    /// <remarks>
    /// A backdrop and a product that are close in colour cannot be told apart
    /// reliably, and the failure is severe: the fill consumes the product and
    /// leaves a white frame holding fragments of labelling.
    ///
    /// Total fill size is a poor test for this — a small item on a large backdrop
    /// legitimately fills most of the frame, so any threshold low enough to catch
    /// the damaging case also rejects perfectly good photographs. What actually
    /// separates the two is *where* the fill reached: products sit in the middle
    /// of a product shot, so a fill that has eaten into the centre has gone wrong
    /// no matter how much of the total it covers.
    /// </remarks>
    private const double MaxCentreFill = 0.35;

    /// <summary>Side of the central sample box, as a fraction of each dimension.</summary>
    private const double CentreBox = 0.3;

    /// <summary>Border must be at least this uniform before its colour is treated as a backdrop.</summary>
    private const double MaxBorderSpread = 42;

    /// <summary>Backdrops lighter than this are already close enough to white to leave alone.</summary>
    private const double AlreadyLight = 232;

    private static double Dist(Rgb24 a, (double R, double G, double B) b) =>
        Math.Sqrt(Math.Pow(a.R - b.R, 2) + Math.Pow(a.G - b.G, 2) + Math.Pow(a.B - b.B, 2));

    /// <summary>
    /// Reads the image, flattens any transparency onto white, and samples the
    /// border to decide whether there is a uniform backdrop behind the product.
    /// </summary>
    private static (Image<Rgba32> Image, Rgba32[] Pixels, int W, int H, bool HadAlpha,
        (double R, double G, double B) Mean, double Spread) Load(string file)
    {
        var image = Image.Load<Rgba32>(file);
        var w = image.Width;
        var h = image.Height;

        var pixels = new Rgba32[w * h];
        image.CopyPixelDataTo(pixels);

        /* Flatten transparency onto white before anything else, so the fill sees
           the colours the customer will actually see. A cut-out PNG has no
           background at all and takes on whatever sits behind it — on a dark page
           that reads as black. */
        var hadAlpha = false;
        for (var i = 0; i < pixels.Length; i++)
        {
            var p = pixels[i];
            if (p.A == 255) continue;

            hadAlpha = true;
            var a = p.A / 255.0;
            pixels[i] = new Rgba32(
                (byte)Math.Round(p.R * a + 255 * (1 - a)),
                (byte)Math.Round(p.G * a + 255 * (1 - a)),
                (byte)Math.Round(p.B * a + 255 * (1 - a)),
                255);
        }

        var samples = new List<Rgb24>();
        var step = Math.Max(1, Math.Min(w, h) / 60);
        Rgb24 At(int x, int y)
        {
            var p = pixels[y * w + x];
            return new Rgb24(p.R, p.G, p.B);
        }

        for (var x = 0; x < w; x += step) { samples.Add(At(x, 0)); samples.Add(At(x, h - 1)); }
        for (var y = 0; y < h; y += step) { samples.Add(At(0, y)); samples.Add(At(w - 1, y)); }

        var mean = (
            R: samples.Average(p => (double)p.R),
            G: samples.Average(p => (double)p.G),
            B: samples.Average(p => (double)p.B));

        var spread = samples.Average(p => Dist(p, mean));

        return (image, pixels, w, h, hadAlpha, mean, spread);
    }

    /// <summary>
    /// Flood fills inward from the border through pixels matching the backdrop.
    /// </summary>
    /// <remarks>
    /// A flood fill rather than a global colour swap, and that distinction is what
    /// makes it safe: a global swap would also wipe out dark pixels *inside* the
    /// product — the shadowed side of a black can would be punched full of holes.
    /// A fill that can only travel from the border through matching pixels stops
    /// at the product outline.
    ///
    /// Every comparison is against the sampled backdrop, never against the pixel
    /// the fill spread from. Neighbour-relative growing follows a gradient nicely,
    /// but when the product is a similar colour to its backdrop — a black can on
    /// near-black seamless — each step stays within tolerance of the last and the
    /// fill eats the product, leaving only its lighter labelling behind. Anchoring
    /// every comparison to one colour keeps the fill contained.
    /// </remarks>
    private static (bool[] Seen, int Filled) FloodFromBorder(
        Rgba32[] pixels, int w, int h, (double R, double G, double B) backdrop)
    {
        var seen = new bool[w * h];
        var queue = new Stack<int>();

        void Consider(int x, int y)
        {
            var idx = y * w + x;
            if (seen[idx]) return;

            var p = pixels[idx];
            if (Dist(new Rgb24(p.R, p.G, p.B), backdrop) > ColourTolerance) return;

            seen[idx] = true;
            queue.Push(idx);
        }

        for (var x = 0; x < w; x++) { Consider(x, 0); Consider(x, h - 1); }
        for (var y = 0; y < h; y++) { Consider(0, y); Consider(w - 1, y); }

        var filled = 0;
        var order = new List<int>();
        while (queue.Count > 0)
        {
            var idx = queue.Pop();
            var x = idx % w;
            var y = idx / w;
            order.Add(idx);
            filled++;

            if (x > 0) Consider(x - 1, y);
            if (x < w - 1) Consider(x + 1, y);
            if (y > 0) Consider(x, y - 1);
            if (y < h - 1) Consider(x, y + 1);
        }

        return (seen, filled);
    }

    /// <summary>How much of the middle of the frame — where the product should be — the fill reached.</summary>
    private static double CentreShare(bool[] seen, int w, int h)
    {
        var x0 = (int)Math.Floor(w * (0.5 - CentreBox / 2));
        var x1 = (int)Math.Ceiling(w * (0.5 + CentreBox / 2));
        var y0 = (int)Math.Floor(h * (0.5 - CentreBox / 2));
        var y1 = (int)Math.Ceiling(h * (0.5 + CentreBox / 2));

        var total = 0;
        var hit = 0;
        for (var y = y0; y < y1; y++)
        {
            for (var x = x0; x < x1; x++)
            {
                total++;
                if (seen[y * w + x]) hit++;
            }
        }

        return total == 0 ? 0 : (double)hit / total;
    }

    /// <summary>
    /// Puts a product photograph on a white background.
    /// </summary>
    /// <remarks>
    /// When the border is not uniform (a lifestyle shot, a gradient, a background
    /// the product bleeds into) nothing is replaced and the photo is left as it
    /// arrived, because guessing wrong is far more damaging than leaving a dark
    /// backdrop.
    /// </remarks>
    public static NormaliseResult NormaliseToWhite(string file)
    {
        var (image, pixels, w, h, hadAlpha, mean, spread) = Load(file);
        using var _ = image;

        if (spread > MaxBorderSpread)
        {
            /* Busy border — a lifestyle shot rather than a studio cut-out. */
            if (hadAlpha)
            {
                WriteBack(file, pixels, w, h);
                return new NormaliseResult(true, "flattened transparency onto white");
            }
            return new NormaliseResult(false, "background is not uniform — left untouched");
        }

        var backdrop = new Rgb24(
            (byte)Math.Round(mean.R), (byte)Math.Round(mean.G), (byte)Math.Round(mean.B));

        var luma = 0.2126 * backdrop.R + 0.7152 * backdrop.G + 0.0722 * backdrop.B;
        if (luma >= AlreadyLight)
        {
            if (hadAlpha)
            {
                WriteBack(file, pixels, w, h);
                return new NormaliseResult(true, "flattened transparency onto white", backdrop);
            }
            return new NormaliseResult(false, "backdrop already white", backdrop);
        }

        var (seen, filled) = FloodFromBorder(pixels, w, h, mean);

        var share = (double)filled / (w * h);
        if (share < 0.02)
            return new NormaliseResult(false, "no contiguous backdrop found", backdrop);

        var centre = CentreShare(seen, w, h);
        if (centre > MaxCentreFill)
        {
            return new NormaliseResult(false,
                $"backdrop too close to the product (fill reached {centre * 100:F0}% of the centre) — left untouched",
                backdrop);
        }

        for (var i = 0; i < pixels.Length; i++)
            if (seen[i]) pixels[i] = new Rgba32(255, 255, 255, 255);

        WriteBack(file, pixels, w, h);
        return new NormaliseResult(true, $"replaced {share * 100:F0}% backdrop with white", backdrop);
    }

    /// <summary>
    /// Cuts a uniform backdrop out of a photograph, leaving it transparent.
    /// </summary>
    /// <remarks>
    /// The mirror image of <see cref="NormaliseToWhite"/>: the same
    /// border-uniformity test and the same flood fill from the edges, but the
    /// matched pixels are made transparent rather than white, and the result is
    /// written as PNG because JPEG cannot carry an alpha channel.
    ///
    /// Used for artwork that sits on a coloured panel — a hero tile on a green or
    /// red slide — where a white rectangle around the product would read as a
    /// sticker rather than as the product itself.
    /// </remarks>
    public static NormaliseResult CutOutBackdrop(string file, string outFile)
    {
        var (image, pixels, w, h, _, mean, spread) = Load(file);
        using var _img = image;

        if (spread > MaxBorderSpread)
            return new NormaliseResult(false, "background is not uniform — left untouched");

        var backdrop = new Rgb24(
            (byte)Math.Round(mean.R), (byte)Math.Round(mean.G), (byte)Math.Round(mean.B));

        var (seen, filled) = FloodFromBorder(pixels, w, h, mean);

        var share = (double)filled / (w * h);
        if (share < 0.02)
            return new NormaliseResult(false, "no contiguous backdrop found", backdrop);

        var centre = CentreShare(seen, w, h);
        if (centre > MaxCentreFill)
        {
            return new NormaliseResult(false,
                $"product too close in colour to its backdrop (fill reached {centre * 100:F0}% of the centre) — left untouched",
                backdrop);
        }

        for (var i = 0; i < pixels.Length; i++)
            if (seen[i]) pixels[i] = pixels[i] with { A = 0 };

        WriteBack(outFile, pixels, w, h, forcePng: true);
        return new NormaliseResult(true, $"cut out {share * 100:F0}% backdrop", backdrop);
    }

    /// <summary>
    /// Writes the pixels back, keeping the original container so the stored
    /// filename stays truthful.
    /// </summary>
    /// <remarks>
    /// Written beside the original and swapped into place, so a failure part-way
    /// through cannot leave a half-written image where a working one used to be.
    /// </remarks>
    private static void WriteBack(string file, Rgba32[] pixels, int w, int h, bool forcePng = false)
    {
        using var output = Image.LoadPixelData<Rgba32>(pixels, w, h);

        IImageEncoder encoder = forcePng
            ? new PngEncoder()
            : Path.GetExtension(file).ToLowerInvariant() switch
            {
                ".png" => new PngEncoder(),
                ".webp" => new WebpEncoder { Quality = 90 },
                _ => new JpegEncoder { Quality = 90 },
            };

        var tmp = file + ".tmp";
        try
        {
            output.Save(tmp, encoder);
            File.Move(tmp, file, overwrite: true);
        }
        catch
        {
            if (File.Exists(tmp)) File.Delete(tmp);
            throw;
        }
    }
}
