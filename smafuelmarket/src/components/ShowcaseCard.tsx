import Link from "next/link";
import ProductImage from "./ProductImage";
import type { ShowcaseTile } from "@/lib/home-content";

export type Tile = ShowcaseTile;

/**
 * The dark grid card that fills the home page: a heading, either one large
 * image or a 2×2 tile grid, and a link at the bottom.
 *
 * Tiles show an uploaded photograph when the admin has set one and fall back to
 * the generated illustration otherwise, so a partly-photographed home page
 * stays coherent instead of showing holes.
 */
export default function ShowcaseCard({
  title,
  tiles,
  linkLabel,
  linkHref,
  variant = "grid",
}: {
  title: string;
  tiles: Tile[];
  linkLabel: string;
  linkHref: string;
  variant?: "grid" | "single";
}) {
  if (tiles.length === 0) return null;

  return (
    <section className="card lift flex flex-col p-5">
      <h2 className="mb-4 text-[20px] font-extrabold leading-6 text-white">{title}</h2>

      {variant === "single" ? (
        <Link href={tiles[0].href} className="group block flex-1">
          <div className="overflow-hidden rounded-xl bg-surface-2">
            <ProductImage
              imageUrl={tiles[0].imageUrl}
              art={tiles[0].art}
              hue={tiles[0].hue}
              alt={tiles[0].label}
              className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-[1.06]"
            />
          </div>
        </Link>
      ) : (
        <div className="grid flex-1 grid-cols-2 gap-3">
          {tiles.slice(0, 4).map((tile) => (
            <Link key={tile.label + tile.href} href={tile.href} className="group block">
              <div className="overflow-hidden rounded-xl bg-surface-2">
                <ProductImage
                  imageUrl={tile.imageUrl}
                  art={tile.art}
                  hue={tile.hue}
                  alt={tile.label}
                  className="aspect-square w-full transition-transform duration-500 group-hover:scale-[1.09]"
                />
              </div>
              <p className="mt-2 text-xs font-medium leading-4 text-ink-soft transition-colors group-hover:text-white">
                {tile.label}
              </p>
            </Link>
          ))}
        </div>
      )}

      <Link
        href={linkHref}
        className="link-draw mt-5 self-start text-[13px] font-bold text-brand-green"
      >
        {linkLabel}
      </Link>
    </section>
  );
}
