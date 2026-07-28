/**
 * Order types and lifecycle constants.
 *
 * These live outside `cart.tsx` deliberately. That file is a `"use client"`
 * module, and runtime values imported from a client module into a server
 * component arrive as client-reference stubs rather than the real value — an
 * array imported that way is not an array and blows up at prerender. Keeping
 * the shared constants in a plain module lets both sides import them safely.
 */

export type CartLine = { productId: string; quantity: number };

export type OrderStatus =
  | "pending" | "confirmed" | "preparing" | "out-for-delivery" | "delivered" | "cancelled";

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Ordered lifecycle, used to render the tracking stepper. */
export const orderFlow: OrderStatus[] = [
  "pending", "confirmed", "preparing", "out-for-delivery", "delivered",
];

export const orderStatusTone: Record<OrderStatus, "good" | "warn" | "bad" | "info" | "muted"> = {
  pending: "muted",
  confirmed: "info",
  preparing: "warn",
  "out-for-delivery": "info",
  delivered: "good",
  cancelled: "bad",
};

export type Order = {
  id: string;
  placedAt: string;
  lines: CartLine[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  couponCode?: string;
  address: string;
};
