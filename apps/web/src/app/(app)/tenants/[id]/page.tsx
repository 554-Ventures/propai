"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api";
import { Button } from "../../../../components/ui/button";

type Tenant = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
};

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;
  const [form, setForm] = useState<Tenant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<Tenant>(`/tenants/${tenantId}`, { auth: true });
        setForm(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tenant");
      }
    };

    if (tenantId) {
      void load();
    }
  }, [tenantId]);

  const update = (key: keyof Tenant, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setLoading(true);
    setError(null);

    try {
      const updated = await apiFetch<Tenant>(`/tenants/${tenantId}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify(form)
      });
      setForm(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tenant");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Delete this tenant?")) return;
    setLoading(true);
    try {
      await apiFetch(`/tenants/${tenantId}`, { method: "DELETE", auth: true });
      router.push("/tenants");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tenant");
    } finally {
      setLoading(false);
    }
  };

  if (!form) {
    return <p className="text-sm text-slate-400">Loading tenant...</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">
            {form.firstName} {form.lastName}
          </h2>
          <p className="text-sm text-slate-400">Update contact details.</p>
        </div>
        <Button variant="destructive" onClick={onDelete} disabled={loading}>
          Delete
        </Button>
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">First Name</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
            value={form.firstName}
            onChange={(event) => update("firstName", event.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">Last Name</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
            value={form.lastName}
            onChange={(event) => update("lastName", event.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">Email</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
            value={form.email ?? ""}
            onChange={(event) => update("email", event.target.value)}
            type="email"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">Phone</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
            value={form.phone ?? ""}
            onChange={(event) => update("phone", event.target.value)}
          />
        </div>

        {error && (
          <div className="md:col-span-2 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="md:col-span-2 flex justify-end">
          <Button disabled={loading}>{loading ? "Saving..." : "Save changes"}</Button>
        </div>
      </form>
    </div>
  );
}
