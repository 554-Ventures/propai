"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./ui/button";
import { useAuth } from "./auth-provider";
import { ThemeToggle } from "./theme-toggle";
import ChatPane from "./chat-pane";
import { CHAT_OPEN_EVENT } from "../lib/chat-events";

const navSections = [
  {
    title: "Portfolio Management",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/properties", label: "Properties" },
      { href: "/tenants", label: "Tenants" },
      { href: "/leases", label: "Leases" }
    ]
  },
  {
    title: "Financial Operations",
    items: [
      { href: "/cashflow", label: "Cashflow" },
      { href: "/documents", label: "Documents" }
    ]
  },
  {
    title: "Operations & Insights",
    items: [
      { href: "/vendors", label: "Vendors" },
      { href: "/analytics", label: "Analytics" }
    ]
  }
];

const STORAGE_ASSISTANT_WIDTH = "propai_assistant_pane_width";
const STORAGE_ASSISTANT_COLLAPSED = "propai_assistant_pane_collapsed";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [query]);

  return matches;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, org, role, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isLgUp = useMediaQuery("(min-width: 1024px)");
  const [assistantCollapsed, setAssistantCollapsed] = useState(false);
  const [assistantWidth, setAssistantWidth] = useState(420);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  // Load persisted assistant pane state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedWidth = Number(localStorage.getItem(STORAGE_ASSISTANT_WIDTH));
    const savedCollapsed = localStorage.getItem(STORAGE_ASSISTANT_COLLAPSED);
    if (!Number.isNaN(savedWidth) && savedWidth > 0) setAssistantWidth(savedWidth);
    if (savedCollapsed === "1") setAssistantCollapsed(true);
  }, []);

  // Persist assistant state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_ASSISTANT_WIDTH, String(assistantWidth));
  }, [assistantWidth]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_ASSISTANT_COLLAPSED, assistantCollapsed ? "1" : "0");
  }, [assistantCollapsed]);

  // Keep drawer open state in sync with collapse state on mobile.
  useEffect(() => {
    if (isLgUp) return;
    setDrawerOpen(!assistantCollapsed);
  }, [assistantCollapsed, isLgUp]);

  // Respond to "open chat" events (e.g. from existing buttons).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOpen = () => {
      setAssistantCollapsed(false);
      setDrawerOpen(true);
    };
    window.addEventListener(CHAT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CHAT_OPEN_EVENT, onOpen);
  }, []);

  const startDrag = useCallback((event: React.PointerEvent) => {
    if (!isLgUp) return;
    dragState.current = { startX: event.clientX, startWidth: assistantWidth };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }, [assistantWidth, isLgUp]);

  const onDrag = useCallback((event: React.PointerEvent) => {
    if (!isLgUp) return;
    if (!dragState.current) return;
    const delta = dragState.current.startX - event.clientX;
    setAssistantWidth(clamp(dragState.current.startWidth + delta, 320, 720));
  }, [isLgUp]);

  const endDrag = useCallback(() => {
    dragState.current = null;
  }, []);

  const initials = useMemo(() => {
    if (!user) return "U";
    if (user.name) {
      return user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  }, [user]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative flex h-full w-full overflow-hidden">
        {/* Left nav */}
        <aside className="hidden w-64 flex-col border-r border-border bg-sidebar lg:flex">
          <div className="px-5 pb-4 pt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-500/70">PropAI</p>
            <h1 className="mt-1 text-lg font-semibold">Portfolio</h1>
            {org?.name ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Org: <span className="text-foreground">{org.name}</span>
              </p>
            ) : null}
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-3 pb-4">
            {navSections.map((section) => (
              <div key={section.title} className="mb-4">
                <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.title}
                </h2>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block rounded-xl px-3 py-2 text-sm transition ${
                          active
                            ? "bg-cyan-500/10 text-cyan-400"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-border px-4 py-4">
            {user ? (
              <div className="relative">
                <button
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2 text-left text-sm text-foreground transition hover:border-cyan-500/60"
                  onClick={() => setMenuOpen((prev) => !prev)}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-400">
                    {initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                    <span className="block truncate text-sm">{user.name ?? "Account"}</span>
                  </span>
                </button>
                {menuOpen && (
                  <div className="absolute bottom-14 left-0 w-full rounded-2xl border border-border bg-popover p-2 text-sm shadow-xl">
                    <div className="px-3 py-2 text-xs text-muted-foreground">Account</div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm text-foreground">Theme</span>
                      <ThemeToggle />
                    </div>
                    {(role === "OWNER" || role === "ADMIN") && (
                      <Link
                        href="/settings/org"
                        className="block rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-accent"
                      >
                        Org Settings
                      </Link>
                    )}
                    <button
                      className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-500 transition hover:bg-red-500/10"
                      onClick={logout}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button asChild variant="secondary" className="w-full">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </aside>

        {/* Center */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <div className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 lg:hidden">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-500/70">PropAI</p>
              <p className="truncate text-sm text-foreground">{org?.name ?? "Portfolio"}</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground"
                onClick={() => {
                  setAssistantCollapsed(false);
                  setDrawerOpen(true);
                }}
              >
                Assistant
              </button>
            </div>
          </div>

          <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-5xl rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/10 dark:shadow-black/40">
              {children}
            </div>
          </main>

          {/* Desktop collapsed assistant reopen affordance */}
          {isLgUp && assistantCollapsed && (
            <button
              className="absolute right-3 top-3 rounded-2xl border border-border bg-card px-3 py-2 text-xs text-foreground hover:border-cyan-500/60"
              onClick={() => setAssistantCollapsed(false)}
            >
              Open Assistant
            </button>
          )}
        </div>

        {/* Desktop resizer */}
        {isLgUp && !assistantCollapsed && (
          <div
            className="group relative w-2 cursor-col-resize bg-transparent"
            onPointerDown={startDrag}
            onPointerMove={onDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            role="separator"
            aria-label="Resize assistant panel"
          >
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition group-hover:bg-cyan-500/60" />
          </div>
        )}

        {/* Right assistant (desktop docked) */}
        {isLgUp && !assistantCollapsed && (
          <aside
            className="flex h-full flex-col border-l border-border bg-sidebar"
            style={{ width: assistantWidth }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-500/70">Assistant</p>
                <p className="text-xs text-muted-foreground">Ask about rent, expenses, leases.</p>
              </div>
              <button
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground hover:border-cyan-500/60"
                onClick={() => setAssistantCollapsed(true)}
              >
                Collapse
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <ChatPane />
            </div>
          </aside>
        )}

        {/* Mobile assistant drawer */}
        {!isLgUp && (
          <div
            className={`fixed inset-0 z-50 ${drawerOpen ? "" : "pointer-events-none"}`}
            aria-hidden={!drawerOpen}
          >
            <div
              className={`absolute inset-0 bg-black/60 transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0"}`}
              onClick={() => {
                setDrawerOpen(false);
                setAssistantCollapsed(true);
              }}
            />
            <aside
              className={`absolute right-0 top-0 flex h-full w-[92vw] max-w-md flex-col border-l border-border bg-popover shadow-2xl transition-transform ${
                drawerOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-500/70">Assistant</p>
                  <p className="text-xs text-muted-foreground">Ask about rent, expenses, leases.</p>
                </div>
                <button
                  className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground"
                  onClick={() => {
                    setDrawerOpen(false);
                    setAssistantCollapsed(true);
                  }}
                >
                  Close
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <ChatPane />
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
