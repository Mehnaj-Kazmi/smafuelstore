import Link from "next/link";
import ProductArt from "./ProductArt";
import type { ArtKey } from "@/lib/catalog";

export type Tile = { label: string; href: string; art: ArtKey; hue: number };

/**
 * The white grid card that fills the home page: a heading, either one large
 * image or a 2×2 tile grid, and a link at the bottom.
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
  return (
    <section className="flex flex-col bg-white p-5">
      <h2 className="mb-3 text-[21px] font-bold leading-6">{title}</h2>

      {variant === "single" ? (
        <Link href={tiles[0].href} className="group block flex-1">
          <div className="overflow-hidden rounded-sm">
            <ProductArt
              art={tiles[0].art}
              hue={tiles[0].hue}
              className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>
        </Link>
      ) : (
        <div className="grid flex-1 grid-cols-2 gap-3">
          {tiles.slice(0, 4).map((tile) => (
            <Link key={tile.label + tile.href} href={tile.href} className="group block">
              <div className="overflow-hidden rounded-sm">
                <ProductArt
                  art={tile.art}
                  hue={tile.hue}
                  className="aspect-square w-full transition-transform duration-300 group-hover:scale-[1.05]"
                />
              </div>
              <p className="mt-1.5 text-xs leading-4">{tile.label}</p>
            </Link>
          ))}
        </div>
      )}

      <Link href={linkHref} className="mt-4 text-[13px] text-sma-link hover:text-sma-link-hover hover:underline">
        {linkLabel}
      </Link>
    </section>
  );
}
