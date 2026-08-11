using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace SmaFuelMarket.Api.Security;

/// <summary>
/// Puts every controller under a shared path segment.
/// </summary>
/// <remarks>
/// Nest did this with <c>setGlobalPrefix('api')</c>, and the storefront's
/// <c>NEXT_PUBLIC_API_URL</c> already ends in <c>/api</c>. Doing it as a
/// convention keeps the decision in one place: a controller added later inherits
/// it, where a hand-typed <c>[Route("api/…")]</c> is one someone will eventually
/// leave off and then wonder why the page 404s.
///
/// Static uploads are mounted outside MVC and so keep their bare <c>/uploads/</c>
/// path, which is what the upload endpoint hands back.
/// </remarks>
public class RoutePrefixConvention(string prefix) : IApplicationModelConvention
{
    private readonly AttributeRouteModel _prefix = new() { Template = prefix };

    public void Apply(ApplicationModel application)
    {
        foreach (var selector in application.Controllers.SelectMany(c => c.Selectors))
        {
            selector.AttributeRouteModel = selector.AttributeRouteModel is null
                ? _prefix
                : AttributeRouteModel.CombineAttributeRouteModel(_prefix, selector.AttributeRouteModel);
        }
    }
}

public static class RoutePrefixExtensions
{
    public static Microsoft.AspNetCore.Mvc.MvcOptions UseRoutePrefix(
        this Microsoft.AspNetCore.Mvc.MvcOptions options, string prefix)
    {
        options.Conventions.Insert(0, new RoutePrefixConvention(prefix));
        return options;
    }
}
