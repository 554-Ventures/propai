"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { AuthUser, clearStoredAuth, getStoredToken, getStoredUser, setStoredAuth } from "../lib/auth";
import { apiFetch } from "../lib/api";

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setToken(getStoredToken());
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiFetch<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    setStoredAuth(response.token, response.user);
    setToken(response.token);
    setUser(response.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await apiFetch<{ token: string; user: AuthUser }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });

    setStoredAuth(response.token, response.user);
    setToken(response.token);
    setUser(response.user);
  };

  const logout = () => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const value = useMemo(
    () => ({ token, user, loading, login, signup, logout }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
