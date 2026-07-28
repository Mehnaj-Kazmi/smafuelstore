import type { Metadata } from "next";
import { primaryStore } from "@/lib/store-location";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers about delivery, the two-mile radius, age-restricted items, returns and payment.",
};

const groups = [
  {
    title: "Delivery",
    faqs: [
      { q: "How long does delivery take?", a: "Most orders arrive in about 30 minutes. Hot food is made after you order, so it leaves the store last and arrives hot." },
      { q: `Why is delivery limited to ${primaryStore.radiusMiles} miles?`, a: "Half the shop is temperature sensitive. Beyond two miles coffee is cold and ice cream is soft, so we would rather keep the promise than stretch the map." },
      { q: "How much is delivery?", a: "$3.99, or free on orders over $20 after any discount." },
      { q: "Can I collect instead?", a: "Yes. The store is open 24 hours — browse here and pick up at the counter." },
    ],
  },
  {
    title: "Location & availability",
    faqs: [
      { q: "Why is Add to Cart disabled for me?", a: "You are outside the delivery radius, or we could not confirm your location. Browsing stays open either way — only ordering is gated." },
      { q: "Why do you ask for my location?", a: "Only to measure the distance to the nearest store. The coordinates are compared on your device and are not sent anywhere." },
      { q: "I blocked location by mistake. How do I fix it?", a: "Click the padlock in your browser's address bar, allow location for this site, then use the 'Try again' link in the banner at the top." },
    ],
  },
  {
    title: "Age-restricted items",
    faqs: [
      { q: "What needs ID?", a: "Everything in the Tobacco department, including lighters. Photo ID is required at handover, every time." },
      { q: "What if I don't have ID on me?", a: "The driver will refuse handover of those items and refund them in full. The rest of your order is delivered as normal." },
    ],
  },
  {
    title: "Orders & payment",
    faqs: [
      { q: "Can I change or cancel an order?", a: "Until it reaches Preparing, yes — from Your Orders. After that the food is already being made." },
      { q: "Something was missing or wrong.", a: "Report it from the order and we refund that line immediately. No need to return anything." },
      { q: "Which payment methods work?", a: "Card, cash on delivery, or your fuel rewards balance." },
      { q: "How do coupons work?", a: "Enter the code at checkout. One code per order, applied to the subtotal before delivery and tax." },
    ],
  },
];

export default function FaqsPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-6">
      <div className="rounded-lg bg-sma-navy-light px-6 py-8 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">Frequently asked questions</h1>
        <p className="mt-1 text-sm text-gray-300">Delivery, the radius rule, ID checks, orders and payment.</p>
      </div>

      {groups.map((g) => (
        <section key={g.title} className="mt-5 bg-surface p-6">
          <h2 className="mb-3 text-xl font-bold">{g.title}</h2>
          <div className="divide-y divide-sma-border">
            {g.faqs.map((f) => (
              <details key={f.q} className="group py-3">
                <summary className="cursor-pointer list-none text-sm font-bold marker:content-none">
                  <span className="mr-2 inline-block text-sma-link transition group-open:rotate-90">›</span>
                  {f.q}
                </summary>
                <p className="mt-2 pl-5 text-[13px] leading-6 text-sma-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
