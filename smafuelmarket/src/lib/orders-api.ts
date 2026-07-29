"use client";

import { api } from "./api";
import type { OrderStatus } from "./orders";

/** An order as the API returns it. */
export type ApiOrder = {
  id: string;
  placedAt: string;
  status: string;
  subtotal: string | number;
  discount: string | number;
  deliveryFee: string | number;
  tax: string | number;
  total: string | number;
  couponCode: string | null;
  address: {
    recipient: string | null;
    line1: string;
    city: string;
    zip: string;
    notes: string | null;
  } | null;
  user?: { id: string; name: string; email: string; phone: string | null };
  items: {
    id: string;
    quantity: number;
    unitPrice: string | number;
    product: {
      id: string;
      title: string;
      unit: string;
      art: string;
      hue: number;
      imageUrl: string | null;
    };
  }[];
};

export type NewOrder = {
  items: { productId: string; quantity: number }[];
  address: { recipient: string; line1: string; city: string; zip: string; notes?: string };
  couponCode?: string;
};

/*
 * The API stores money as Prisma Decimal, which serialises to a string. Every
 * read goes through here so a total is a number by the time any component
 * formats it — "13.97" + 3.99 would otherwise concatenate rather than add.
 */
export function money(v: string | number): number {
  return typeof v === "number" ? v : Number(v);
}

/** The API's SCREAMING_SNAKE status mapped to the storefront's labels. */
export function toStatus(apiStatus: string): OrderStatus {
  const map: Record<string, OrderStatus> = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    PREPARING: "preparing",
    OUT_FOR_DELIVERY: "out-for-delivery",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
  };
  return map[apiStatus] ?? "pending";
}

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export function placeOrder(order: NewOrder) {
  return api.post<ApiOrder>("/orders", order);
}

export function myOrders() {
  return api.get<ApiOrder[]>("/orders/mine");
}

export function allOrders() {
  return api.get<ApiOrder[]>("/orders/all");
}

export function setOrderStatus(id: string, status: string) {
  return api.patch<ApiOrder>(`/orders/${id}/status`, { status });
}

export type OrderStats = {
  orders: {
    id: string;
    placedAt: string;
    status: string;
    subtotal: string | number;
    total: string | number;
    items: { quantity: number; unitPrice: string | number; product: { id: string; title: string; departmentSlug: string } }[];
  }[];
  customers: number;
};

export function orderStats() {
  return api.get<OrderStats>("/orders/stats");
}
