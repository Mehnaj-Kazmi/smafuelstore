import type { NextConfig } from "next";

/*
 * Built as static files.
 *
 * The shop is deployed to Windows hosting that runs no Node, so there is no
 * server to render pages at request time. Everything the storefront needs is
 * fetched from the .NET API in the browser instead, which also means an admin
 * edit reaches customers on their next page load rather than waiting for a
 * rebuild.
 *
 * `trailingSlash` makes each route a folder with an index.html, which is what IIS
 * serves for a directory request — without it, /shop would need a rewrite rule to
 * find /shop.html.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: {
    /* No Node at runtime means no image optimiser. Product photographs are
       already normalised and resized at upload, so there is nothing for it to
       do here anyway. */
    unoptimized: true,
  },
};

export default nextConfig;
