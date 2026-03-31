"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { useAuth } from "./auth-provider";

const navItems = [
  { href: "/properties", label: "Properties" },
  { href: "/tenants", label: "Tenants" }
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-12 pt-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">PropAI</p>
            <h1 className="text-2xl font-semibold">Portfolio Control Center</h1>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="text-right">
                <p className="text-sm text-slate-200">{user.name ?? user.email}</p>
                <button
                  className="text-xs text-slate-400 hover:text-slate-200"
                  onClick={logout}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Button asChild variant="secondary">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </header>

        <nav className="mt-8 flex flex-wrap gap-3">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  active
                    ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-200"
                    : "border-slate-700/60 bg-slate-900/50 text-slate-300 hover:border-slate-500/70"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="mt-10 flex-1 rounded-3xl border border-slate-800/70 bg-slate-900/40 p-6 shadow-2xl shadow-black/40">
          {children}
        </main>
      </div>
    </div>
  );
}
