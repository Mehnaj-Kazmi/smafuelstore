import Link from "next/link";
import ProductArt from "@/components/ProductArt";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[900px] flex-col items-center gap-6 px-4 py-16 text-center sm:flex-row sm:text-left">
      <ProductArt art="soda" hue={205} className="h-44 w-44 shrink-0" />
      <div>
        <h1 className="text-2xl font-bold">Looking for something?</h1>
        <p className="mt-2 text-sm text-sma-muted">
          We&apos;re sorry. The page you requested could not be found. Try browsing a department or heading back to the
          storefront.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
          <Link href="/" className="btn-pill btn-cart font-medium">
            Back to the store
          </Link>
          <Link href="/deals" className="btn-pill bg-white font-medium hover:bg-gray-50">
            Today&apos;s deals
          </Link>
        </div>
      </div>
    </div>
  );
}
