"use client";

import { api } from "./api";

export type ApiReview = {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  title: string | null;
  body: string;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
  user: { name: string };
};

export type ProductReviews = {
  average: number;
  count: number;
  breakdown: Record<"1" | "2" | "3" | "4" | "5", number>;
  items: ApiReview[];
};

export function fetchProductReviews(productId: number) {
  return api.get<ProductReviews>(`/reviews?productId=${productId}`);
}

export function fetchMyReview(productId: number) {
  return api.get<ApiReview | null>(`/reviews/mine?productId=${productId}`);
}

export function submitReview(input: { productId: number; rating: number; title?: string; body: string }) {
  return api.post<ApiReview>("/reviews", input);
}

export function deleteReview(id: number) {
  return api.delete<{ id: number }>(`/reviews/${id}`);
}
