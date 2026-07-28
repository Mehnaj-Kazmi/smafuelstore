"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { getProduct, type Product } from "./catalog";
import type { CartLine, Order } from "./orders";

export type { CartLine, Order, OrderStatus } from "./orders";

type State = {
  lines: CartLine[];
  wishlist: string[];
  orders: Order[];
  hydrated: boolean;
};

type Action =
  | { type: "hydrate"; state: Omit<State, "hydrated"> }
  | { type: "add"; productId: string; quantity: number }
  | { type: "setQuantity"; productId: string; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "clear" }
  | { type: "toggleWish"; productId: string }
  | { type: "placeOrder"; order: Order };

const STORAGE_KEY = "sma-gas-store:v1";

const initial: State = { lines: [], wishlist: [], orders: [], hydrated: false };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.state, hydrated: true };

    case "add": {
      const cap = getProduct(action.productId)?.stock ?? 99;
      if (cap <= 0) return state;
      const existing = state.lines.find((l) => l.productId === action.productId);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) =>
            l.productId === action.productId
              ? { ...l, quantity: Math.min(cap, l.quantity + action.quantity) }
              : l,
          ),
        };
      }
      return {
        ...state,
        lines: [...state.lines, { productId: action.productId, quantity: Math.min(cap, action.quantity) }],
      };
    }

    case "setQuantity": {
      if (action.quantity <= 0) {
        return { ...state, lines: state.lines.filter((l) => l.productId !== action.productId) };
      }
      const cap = getProduct(action.productId)?.stock ?? 99;
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.productId === action.productId ? { ...l, quantity: Math.min(cap, action.quantity) } : l,
        ),
      };
    }

    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.productId !== action.productId) };

    case "clear":
      return { ...state, lines: [] };

    case "toggleWish":
      return {
        ...state,
        wishlist: state.wishlist.includes(action.productId)
          ? state.wishlist.filter((id) => id !== action.productId)
          : [...state.wishlist, action.productId],
      };

    case "placeOrder":
      return { ...state, lines: [], orders: [action.order, ...state.orders] };

    default:
      return state;
  }
}

export type CartItem = CartLine & { product: Product; lineTotal: number };

type Value = {
  items: CartItem[];
  wishlist: Product[];
  orders: Order[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  savings: number;
  /** True when the cart holds anything requiring an ID check at handover. */
  hasAgeRestricted: boolean;
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  toggleWish: (productId: string) => void;
  isWished: (productId: string) => boolean;
  placeOrder: (details: Omit<Order, "id" | "placedAt" | "lines" | "status">) => Order;
};

const CartContext = createContext<Value | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<State>) : {};
      dispatch({
        type: "hydrate",
        state: {
          lines: (parsed.lines ?? []).filter((l) => Boolean(getProduct(l.productId))),
          wishlist: (parsed.wishlist ?? []).filter((id) => Boolean(getProduct(id))),
          orders: parsed.orders ?? [],
        },
      });
    } catch {
      dispatch({ type: "hydrate", state: { lines: [], wishlist: [], orders: [] } });
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ lines: state.lines, wishlist: state.wishlist, orders: state.orders }),
      );
    } catch {
      /* private mode or quota — the cart still works for this session */
    }
  }, [state.lines, state.wishlist, state.orders, state.hydrated]);

  const value = useMemo<Value>(() => {
    const items: CartItem[] = state.lines.flatMap((line) => {
      const product = getProduct(line.productId);
      if (!product) return [];
      return [{ ...line, product, lineTotal: product.price * line.quantity }];
    });

    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);

    return {
      items,
      wishlist: state.wishlist.flatMap((id) => {
        const p = getProduct(id);
        return p ? [p] : [];
      }),
      orders: state.orders,
      hydrated: state.hydrated,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
      savings: items.reduce(
        (s, i) => s + (i.product.listPrice ? (i.product.listPrice - i.product.price) * i.quantity : 0),
        0,
      ),
      hasAgeRestricted: items.some((i) => i.product.ageRestricted),
      add: (productId, quantity = 1) => dispatch({ type: "add", productId, quantity }),
      setQuantity: (productId, quantity) => dispatch({ type: "setQuantity", productId, quantity }),
      remove: (productId) => dispatch({ type: "remove", productId }),
      clear: () => dispatch({ type: "clear" }),
      toggleWish: (productId) => dispatch({ type: "toggleWish", productId }),
      isWished: (productId) => state.wishlist.includes(productId),
      placeOrder: (details) => {
        const order: Order = {
          ...details,
          id: `GS-${Date.now().toString(36).toUpperCase()}`,
          placedAt: new Date().toISOString(),
          lines: state.lines,
          status: "confirmed",
        };
        dispatch({ type: "placeOrder", order });
        return order;
      },
    };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): Value {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside a CartProvider");
  return ctx;
}
