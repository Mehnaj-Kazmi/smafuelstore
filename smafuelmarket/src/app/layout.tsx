import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DeliveryBanner from "@/components/DeliveryBanner";
import { CartProvider } from "@/lib/cart";
import { DeliveryProvider } from "@/lib/delivery";
import { AuthProvider } from "@/lib/auth";

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
  themeColor: "#131a22",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body id="top">
        <AuthProvider>
          <DeliveryProvider>
            <CartProvider>
              {/* Header reads search params, so it renders inside a Suspense boundary. */}
              <Suspense fallback={<div className="h-[92px] bg-sma-navy" />}>
                <Header />
              </Suspense>
              <DeliveryBanner />
              <main className="min-h-[60vh]">{children}</main>
              <Footer />
            </CartProvider>
          </DeliveryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
