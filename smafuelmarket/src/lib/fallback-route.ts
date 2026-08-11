/**
 * The parameter the fallback shell pages are exported under.
 *
 * A product or department added in the admin panel after the last build has no
 * page of its own, so the server answers with the page exported for this
 * parameter. It deliberately holds no product: a page built for a real one
 * carries that item's markup, and serving it for a different item would show the
 * wrong thing for a frame before the browser corrected it. This one reads the id
 * out of the address bar instead.
 *
 * Kept in a plain module rather than beside the components that use it. A value
 * imported from a `"use client"` file into a server component arrives as a client
 * reference rather than the string itself, and `generateStaticParams` then fails
 * with "a required parameter was not provided as a string".
 */
export const FALLBACK_PARAM = "_";
