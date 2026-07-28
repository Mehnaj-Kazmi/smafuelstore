import Link from "next/link";
import { discountPercent, stockState, type Product } from "@/lib/catalog";
import { dealsForProduct, dealKindClass, dealKindLabel } from "@/lib/deals";
import { compactCount, priceParts } from "@/lib/format";
import ProductArt from "./ProductArt";
import StarRating from "./StarRating";
import AddToCartButton from "./AddToCartButton";
import WishlistButton from "./WishlistButton";

export default function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { whole, cents } = priceParts(product.price);
  const off = discountPercent(product);
  const stock = stockState(product);
  const deal = dealsForProduct(product.id)[0];

  return (
    <article className="group flex h-full flex-col rounded-lg bg-white p-3 transition-shadow hover:shadow-[0_2px_14px_rgba(15,17,17,0.18)]">
      <div className="relative mb-3">
        <Link href={`/product/${product.id}`} className="block">
          <div className="aspect-square overflow-hidden rounded-md">
            <ProductArt
              art={product.art}
              hue={product.hue}
              className="h-full w-full transition-transform duration-300 group-hover:scale-[1.04]"
            />
          </div>
        </Link>

        {deal && (
          <span className={`absolute left-0 top-2 rounded-r px-2 py-0.5 text-[11px] font-bold ${dealKindClass[deal.kind]}`}>
            {dealKindLabel[deal.kind]}
          </span>
        )}

        <WishlistButton
          productId={product.id}
          className="absolute right-1 top-1 rounded-full bg-white/90 p-1.5 text-sma-muted shadow-sm hover:text-sma-link-hover"
        />
      </div>

      <Link href={`/product/${product.id}`} className="block">
        <h3 className={`mb-0.5 text-sm leading-5 group-hover:text-sma-link-hover ${compact ? "line-clamp-2" : "line-clamp-3"}`}>
          {product.title}
        </h3>
      </Link>
      <p className="mb-1 text-xs text-sma-muted">{product.unit}</p>

      <div className="mb-1 flex items-center gap-1.5">
        <StarRating rating={product.rating} />
        <span className="text-xs text-sma-link">{compactCount(product.reviews)}</span>
      </div>

      <div className="flex flex-wrap items-baseline gap-2">
        {off !== null && <span className="text-[13px] font-medium text-sma-deal">-{off}%</span>}
        <span>
          <span className="align-super text-[11px]">$</span>
          <span className="text-[20px] font-medium">{whole}</span>
          <span className="align-super text-[11px]">{cents}</span>
        </span>
      </div>

      {product.listPrice && (
        <p className="text-xs text-sma-muted">
          Was <span className="line-through">${product.listPrice.toFixed(2)}</span>
        </p>
      )}

      {stock === "out" && <p className="mt-1 text-xs font-medium text-sma-deal">Out of stock</p>}
      {stock === "low" && <p className="mt-1 text-xs font-medium text-[#c45500]">Only {product.stock} left</p>}
      {product.ageRestricted && (
        <p className="mt-1 text-xs font-medium text-sma-muted">ID required at handover</p>
      )}

      <div className="mt-auto pt-2">
        <AddToCartButton productId={product.id} block />
      </div>
    </article>
  );
}
