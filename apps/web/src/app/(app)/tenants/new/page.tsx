"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiFetch } from "../../../../lib/api";
import { Button } from "../../../../components/ui/button";

export default function NewTenantPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const tenant = await apiFetch<{ id: string }>("/tenants", {
        method: "POST",
        auth: true,
        body: JSON.stringify(form)
      });
      router.push(`/tenants/${tenant.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tenant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold">Add Tenant</h2>
      <p className="text-sm text-slate-400">Create a new tenant record.</p>

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
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            type="email"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">Phone</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
          />
        </div>

        {error && (
          <div className="md:col-span-2 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="md:col-span-2 flex justify-end">
          <Button disabled={loading}>{loading ? "Saving..." : "Create tenant"}</Button>
        </div>
      </form>
    </div>
  );
}
