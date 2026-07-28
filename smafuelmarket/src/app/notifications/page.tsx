import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };

const items = [
  { when: "12 minutes ago", title: "Your order is out for delivery", body: "Order GS-8K2L4M left the store. Arriving in about 15 minutes.", unread: true, tone: "info" as const },
  { when: "2 hours ago", title: "Flash sale: coffee & donut for $3", body: "Running until 2pm today. Add both to your basket and the discount applies automatically.", unread: true, tone: "deal" as const },
  { when: "Yesterday", title: "Order delivered", body: "Order GS-7Y1P9C was handed over at 8:42pm. Rate your items to help other shoppers.", unread: false, tone: "ok" as const },
  { when: "3 days ago", title: "Back in stock: Trailhead Beef Jerky", body: "The item you saved is available again.", unread: false, tone: "info" as const },
  { when: "Last week", title: "Coupon FUEL5 added to your account", body: "$5 off orders over $30. No expiry.", unread: false, tone: "deal" as const },
];

const toneClass = {
  info: "border-l-sma-link",
  deal: "border-l-sma-deal",
  ok: "border-l-[#007600]",
};

export default function NotificationsPage() {
  const unread = items.filter((i) => i.unread).length;
  return (
    <div className="mx-auto max-w-[800px] px-4 py-6">
      <div className="flex items-center justify-between bg-surface p-5">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="mt-1 text-sm text-sma-muted">{unread} unread</p>
        </div>
        <button type="button" className="text-[13px] text-sma-link hover:text-sma-link-hover hover:underline">
          Mark all as read
        </button>
      </div>

      <ul className="mt-5 space-y-3">
        {items.map((n) => (
          <li key={n.title} className={`border-l-4 bg-surface p-4 ${toneClass[n.tone]} ${n.unread ? "" : "opacity-70"}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold">{n.title}</h2>
              <span className="text-xs text-sma-muted">{n.when}</span>
            </div>
            <p className="mt-1 text-[13px] leading-5 text-sma-muted">{n.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
