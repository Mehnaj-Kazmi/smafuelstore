using System.Text.Json;

namespace SmaFuelMarket.Api.Data;

/// <summary>
/// Reads and writes the columns that hold a list of strings.
/// </summary>
/// <remarks>
/// Postgres had a native string array; MySQL has not, so these are stored as JSON
/// text. The conversion lives here rather than in each service so the storefront
/// keeps seeing <c>tags: ["cold","popular"]</c> — a product whose tags arrived as
/// the string <c>"[\"cold\"]"</c> would render as one long tag and nobody would
/// know why.
///
/// A column that cannot be parsed reads as empty rather than throwing. A product
/// with unreadable tags should still appear in the shop; losing the whole
/// catalogue over one malformed row would be the worse failure.
/// </remarks>
public static class JsonArray
{
    public static string[] Read(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<string[]>(json) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    public static string Write(IEnumerable<string>? values) =>
        JsonSerializer.Serialize(values ?? []);
}
