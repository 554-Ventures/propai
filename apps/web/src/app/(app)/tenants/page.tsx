"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/molecules/page-header";
import { DataCard } from "@/components/ui/molecules/data-card";
import { Skeleton } from "@/components/ui/atoms/skeleton";

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
      <PageHeader
        title="Tenants"
        description="Manage tenant contacts and leases."
        action={
          <Button asChild>
            <Link href="/tenants/new">Add Tenant</Link>
          </Button>
        }
      />

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {loading &&
          Array.from({ length: 2 }).map((_, index) => (
            <Skeleton
              key={`loading-${index}`}
              variant="card"
              className="h-28"
            />
          ))}
        {tenants.map((tenant) => (
          <Link
            key={tenant.id}
            href={`/tenants/${tenant.id}`}
          >
            <DataCard
              variant="interactive"
              title={`${tenant.firstName} ${tenant.lastName}`}
              description={`${tenant.email ?? "No email"} • ${tenant.phone ?? "No phone"}`}
            />
          </Link>
        ))}

        {tenants.length === 0 && !error && !loading && (
          <div className="col-span-full rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No tenants yet. Add your first tenant record.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
