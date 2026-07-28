import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DeliveryBanner from "@/components/DeliveryBanner";
import IntroSplash from "@/components/IntroSplash";
import LocationPrompt from "@/components/LocationPrompt";
import { CartProvider } from "@/lib/cart";
import { DeliveryProvider } from "@/lib/delivery";
import { AuthProvider } from "@/lib/auth";
import { CatalogProvider } from "@/lib/catalog-context";
import { getCatalogProducts } from "@/lib/catalog-source";

export const metadata: Metadata = {
  title: {
    default: "SMA Fuel & Market — Convenience store delivery in 30 minutes",
    template: "%s | SMA Fuel & Market",
  },
  description:
    "Snacks, drinks, hot food, groceries and automotive essentials from your local gas station, delivered in about 30 minutes. Open 24 hours.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  /* Fetched once here and shared with every client component below, so the
     cart and the server-rendered pages agree on the same catalogue. */
  const catalog = await getCatalogProducts();

  return (
    <html lang="en">
      <body id="top">
        <CatalogProvider products={catalog}>
        <AuthProvider>
          <DeliveryProvider>
            <CartProvider>
              {/* No Suspense boundary here on purpose: the header must hydrate
                  in the main pass so its cart and wishlist badges are live on
                  statically prerendered pages. See the note in Header.tsx. */}
              <Header />
              <DeliveryBanner />
              <main className="min-h-[60vh]">{children}</main>
              <Footer />
              <IntroSplash />
              <LocationPrompt />
            </CartProvider>
          </DeliveryProvider>
        </AuthProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
