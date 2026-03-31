"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Tenant = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch<Tenant[]>("/tenants", { auth: true });
        setTenants(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "We couldn't load your tenants.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Tenants</h2>
          <p className="text-sm text-slate-400">Manage tenant contacts and leases.</p>
        </div>
        <Button asChild>
          <Link href="/tenants/new">Add Tenant</Link>
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {loading &&
          Array.from({ length: 2 }).map((_, index) => (
            <div
              key={`loading-${index}`}
              className="h-28 animate-pulse rounded-2xl border border-slate-800/60 bg-slate-950/40"
            />
          ))}
        {tenants.map((tenant) => (
          <Link
            key={tenant.id}
            href={`/tenants/${tenant.id}`}
            className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-5 transition hover:border-cyan-400/60"
          >
            <h3 className="text-lg font-semibold text-slate-100">
              {tenant.firstName} {tenant.lastName}
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              {tenant.email ?? "No email"} · {tenant.phone ?? "No phone"}
            </p>
          </Link>
        ))}

        {tenants.length === 0 && !error && !loading && (
          <div className="rounded-2xl border border-dashed border-slate-700/70 p-6 text-sm text-slate-400">
            No tenants yet. Add your first tenant record.
          </div>
        )}
      </div>
    </div>
  );
}
