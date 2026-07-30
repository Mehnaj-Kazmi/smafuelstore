"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api";

export type Role = "CUSTOMER" | "ADMIN";
export type AuthUser = { id: number; email: string; name: string; role: Role };

type AuthResponse = { accessToken: string; user: AuthUser };

type AuthState = {
  user: AuthUser | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: { email: string; password: string; name: string; phone?: string }) => Promise<AuthUser>;
  /** Completes a reset and signs the user straight in with the returned token. */
  resetPassword: (token: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

const USER_KEY = "sma-gas-store:user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(USER_KEY);
    if (raw && getToken()) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        // Corrupt cache — treat as signed out rather than throwing on load.
      }
    }
    setHydrated(true);
  }, []);

  function persist(res: AuthResponse) {
    setToken(res.accessToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  }

  async function login(email: string, password: string) {
    const res = await api.post<AuthResponse>("/auth/login", { email, password });
    return persist(res);
  }

  async function register(input: { email: string; password: string; name: string; phone?: string }) {
    const res = await api.post<AuthResponse>("/auth/register", input);
    return persist(res);
  }

  async function resetPassword(token: string, password: string) {
    const res = await api.post<AuthResponse>("/auth/reset-password", { token, password });
    return persist(res);
  }

  function logout() {
    setToken(null);
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, hydrated, login, register, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/**
 * Asks for a reset link.
 *
 * The reply is the same whether or not the address is registered, so nothing
 * here should be treated as confirmation that an account exists. `devResetLink`
 * is only present while the API runs outside production, where no mail service
 * is configured.
 */
export function requestPasswordReset(email: string) {
  return api.post<{ message: string; devResetLink?: string }>("/auth/forgot-password", { email });
}
