"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { type Product } from "./catalog";
import { useCatalog } from "./catalog-context";
import { useAuth } from "./auth";
import type { CartLine } from "./orders";

export type { CartLine, Order, OrderStatus } from "./orders";

type State = {
  lines: CartLine[];
  wishlist: number[];
  hydrated: boolean;
};

type Action =
  | { type: "hydrate"; state: Omit<State, "hydrated"> }
  | { type: "add"; productId: number; quantity: number }
  | { type: "setQuantity"; productId: number; quantity: number }
  | { type: "remove"; productId: number }
  | { type: "clear" }
  | { type: "toggleWish"; productId: number };

/*
 * Basket and wishlist are stored per account.
 *
 * They used to share one key for the whole browser, so signing out and signing
 * in as someone else showed the previous person's saved items — on a shared or
 * demo machine that is a privacy leak, not just a glitch. Keying on the user id
 * means each account gets its own bucket and a returning customer finds their
 * own basket exactly as they left it.
 */
const STORAGE_PREFIX = "sma-gas-store:v2";
const GUEST = "guest";

function storageKey(userId: number | null) {
  return `${STORAGE_PREFIX}:${userId ?? GUEST}`;
}

const initial: State = { lines: [], wishlist: [], hydrated: false };

/**
 * Built per-catalogue rather than declared once at module scope, so the stock
 * caps below come from the live product list the storefront rendered — not from
 * the seed data, which would cap a newly added product at a stale number.
 */
function makeReducer(getProduct: (id: number) => Product | undefined) {
  return function reducer(state: State, action: Action): State {
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

      default:
        return state;
    }
  };
}

export type CartItem = CartLine & { product: Product; lineTotal: number };

type Value = {
  items: CartItem[];
  wishlist: Product[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  savings: number;
  /** True when the cart holds anything requiring an ID check at handover. */
  hasAgeRestricted: boolean;
  add: (productId: number, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  toggleWish: (productId: number) => void;
  isWished: (productId: number) => boolean;
};

const CartContext = createContext<Value | null>(null);

function read(key: string): { lines: CartLine[]; wishlist: number[] } {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as Partial<State>) : {};
    return { lines: parsed.lines ?? [], wishlist: parsed.wishlist ?? [] };
  } catch {
    return { lines: [], wishlist: [] };
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { getProduct } = useCatalog();
  const { user, hydrated: authReady } = useAuth();
  const reducer = useMemo(() => makeReducer(getProduct), [getProduct]);
  const [state, dispatch] = useReducer(reducer, initial);

  const userId = user?.id ?? null;
  /** Which bucket the current state came from, so we never save into another. */
  const loadedFor = useRef<number | null>(null);

  useEffect(() => {
    if (!authReady) return;

    const key = storageKey(userId);
    const own = read(key);

    /*
     * A basket built while signed out follows the customer into their account.
     * This matters because adding to the cart is what sends a guest to sign in
     * — losing the basket at that exact moment would be the worst possible
     * time. The wishlist is deliberately not merged: saved items are personal,
     * and inheriting a stranger's is the bug this whole change fixes.
     */
    let lines = own.lines;
    if (userId) {
      const guest = read(storageKey(null));
      if (guest.lines.length) {
        const merged = [...own.lines];
        for (const line of guest.lines) {
          const existing = merged.find((l) => l.productId === line.productId);
          if (existing) existing.quantity += line.quantity;
          else merged.push({ ...line });
        }
        lines = merged;
        try {
          window.localStorage.removeItem(storageKey(null));
        } catch {
          /* the guest bucket is replaced on next write anyway */
        }
      }
    }

    loadedFor.current = userId;
    dispatch({
      type: "hydrate",
      state: {
        /* Drop anything no longer in the catalogue, so a deleted product cannot
           sit in a basket forever as an unrenderable line. */
        lines: lines.filter((l) => Boolean(getProduct(l.productId))),
        wishlist: own.wishlist.filter((id) => Boolean(getProduct(id))),
      },
    });
  }, [authReady, userId, getProduct]);

  useEffect(() => {
    if (!state.hydrated) return;
    /* Only write once the state belongs to the signed-in user, otherwise the
       moment of switching accounts would copy one basket into the other. */
    if (loadedFor.current !== userId) return;

    try {
      window.localStorage.setItem(
        storageKey(userId),
        JSON.stringify({ lines: state.lines, wishlist: state.wishlist }),
      );
    } catch {
      /* private mode or quota — the cart still works for this session */
    }
  }, [state.lines, state.wishlist, state.hydrated, userId]);

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
    };
  }, [state, getProduct]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): Value {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside a CartProvider");
  return ctx;
}
