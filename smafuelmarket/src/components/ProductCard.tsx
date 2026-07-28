import Link from "next/link";
import { discountPercent, stockState, type Product } from "@/lib/catalog";
import { dealsForProduct, dealKindClass, dealKindLabel } from "@/lib/deals";
import { compactCount, priceParts } from "@/lib/format";
import ProductImage from "./ProductImage";
import StarRating from "./StarRating";
import AddToCartButton from "./AddToCartButton";
import WishlistButton from "./WishlistButton";

export default function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { whole, cents } = priceParts(product.price);
  const off = discountPercent(product);
  const stock = stockState(product);
  const deal = dealsForProduct(product.id)[0];

  return (
    <article className="card lift shine group flex h-full flex-col p-3">
      <div className="relative mb-3">
        <Link href={`/product/${product.id}`} className="block">
          <div className="aspect-square overflow-hidden rounded-xl bg-surface-2">
            <ProductImage
              imageUrl={product.imageUrl}
              art={product.art}
              hue={product.hue}
              alt={product.title}
              className="h-full w-full transition-transform duration-500 group-hover:scale-[1.07]"
            />
          </div>
        </Link>

        {deal && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${dealKindClass[deal.kind]}`}
          >
            {dealKindLabel[deal.kind]}
          </span>
        )}

        <WishlistButton
          productId={product.id}
          className="absolute right-2 top-2 rounded-full border border-line bg-black/60 p-1.5 text-ink-soft backdrop-blur transition hover:border-brand-green hover:text-brand-green"
        />
      </div>

      <Link href={`/product/${product.id}`} className="block">
        <h3
          className={`mb-0.5 text-sm font-semibold leading-5 text-white transition-colors group-hover:text-brand-green ${
            compact ? "line-clamp-2" : "line-clamp-3"
          }`}
        >
          {product.title}
        </h3>
      </Link>
      <p className="mb-1.5 text-xs text-ink-faint">{product.unit}</p>

      <div className="mb-2 flex items-center gap-1.5">
        <StarRating rating={product.rating} />
        <span className="text-xs text-ink-faint">{compactCount(product.reviews)}</span>
      </div>

      <div className="flex flex-wrap items-baseline gap-2">
        {off !== null && (
          <span className="rounded-md bg-sma-deal/15 px-1.5 py-0.5 text-[12px] font-bold text-sma-deal">
            -{off}%
          </span>
        )}
        <span className="text-white">
          <span className="align-super text-[11px]">$</span>
          <span className="text-[22px] font-extrabold tracking-tight">{whole}</span>
          <span className="align-super text-[11px]">{cents}</span>
        </span>
      </div>

      {product.listPrice && (
        <p className="text-xs text-ink-faint">
          Was <span className="line-through">${product.listPrice.toFixed(2)}</span>
        </p>
      )}

      {stock === "out" && <p className="mt-1 text-xs font-semibold text-sma-deal">Out of stock</p>}
      {stock === "low" && (
        <p className="mt-1 text-xs font-semibold text-brand-orange">Only {product.stock} left</p>
      )}
      {product.ageRestricted && (
        <p className="mt-1 text-xs font-medium text-ink-faint">ID required at handover</p>
      )}

      <div className="mt-auto pt-3">
        <AddToCartButton productId={product.id} block />
      </div>
    </article>
  );
}
