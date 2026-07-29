import ProductArt from "./ProductArt";
import type { ArtKey } from "@/lib/catalog";

/** Absolute origin of the API, derived from the configured /api base URL. */
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(
  /\/api\/?$/,
  "",
);

/** Turns the API's `/uploads/x.jpg` into a URL the browser can load. */
export function imageSrc(url: string): string {
  return /^https?:\/\//.test(url) ? url : `${API_ORIGIN}${url}`;
}

/**
 * A product's picture: the uploaded photograph when there is one, otherwise the
 * generated illustration.
 *
 * Every product surface goes through here so the fallback is decided in one
 * place — a catalogue that mixes photographed and un-photographed items renders
 * consistently instead of leaving holes where an image is missing.
 */
export default function ProductImage({
  imageUrl,
  art,
  hue,
  alt,
  className,
  bare = false,
  eager = false,
  transparent = false,
}: {
  imageUrl?: string | null;
  art: ArtKey;
  hue: number;
  alt: string;
  className?: string;
  bare?: boolean;
  /** Set on above-the-fold images so they are not deferred. */
  eager?: boolean;
  /**
   * Drops the white backdrop, for artwork placed on a coloured panel where a
   * white rectangle would read as a sticker rather than as the product. Only
   * worth setting for images that have actually been cut out — anything still
   * carrying a white background in its pixels will look the same either way.
   */
  transparent?: boolean;
}) {
  if (!imageUrl) return <ProductArt art={art} hue={hue} className={className} bare={bare} />;

  /*
   * Photographs sit on white, the way a product catalogue expects.
   *
   * Two things made the backgrounds inconsistent before this. A PNG with an
   * alpha channel had nothing behind it but the dark card, so it read as black
   * while the opaque JPEGs carried their own white studio backdrop. And
   * `object-cover` cropped anything that was not square, so how much of a
   * photo's own background showed varied with its aspect ratio.
   *
   * A white backdrop fixes the first; `object-contain` fixes the second by
   * fitting the whole photo inside the frame and letting the white fill the
   * rest. Note this cannot fix a photo that was shot on a black background —
   * that colour is baked into the file and only a replacement image changes it.
   */
  return (
    /* eslint-disable-next-line @next/next/no-img-element --
       next/image would need the API host registered in next.config, and these
       are already-optimised uploads served from our own API. */
    <img
      src={imageSrc(imageUrl)}
      alt={alt}
      /* The product page hero is the largest element on screen; deferring it
         would delay the page's main content for no saving. */
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      className={`${className ?? ""} object-contain ${transparent ? "" : "bg-white"}`}
    />
  );
}
