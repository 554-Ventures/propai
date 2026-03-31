"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiFetch } from "../../../../lib/api";
import { Button } from "../../../../components/ui/button";

export default function NewPropertyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    notes: ""
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
      const property = await apiFetch<{ id: string }>("/properties", {
        method: "POST",
        auth: true,
        body: JSON.stringify(form)
      });
      router.push(`/properties/${property.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold">Add Property</h2>
      <p className="text-sm text-slate-400">Add a new building to your portfolio.</p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-wide text-slate-400">Property Name</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-wide text-slate-400">Address Line 1</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
            value={form.addressLine1}
            onChange={(event) => update("addressLine1", event.target.value)}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-wide text-slate-400">Address Line 2</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
            value={form.addressLine2}
            onChange={(event) => update("addressLine2", event.target.value)}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">City</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
            value={form.city}
            onChange={(event) => update("city", event.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">State</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
            value={form.state}
            onChange={(event) => update("state", event.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">Postal Code</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
            value={form.postalCode}
            onChange={(event) => update("postalCode", event.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">Country</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
            value={form.country}
            onChange={(event) => update("country", event.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-wide text-slate-400">Notes</label>
          <textarea
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
            rows={3}
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
          />
        </div>

        {error && (
          <div className="md:col-span-2 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="md:col-span-2 flex justify-end">
          <Button disabled={loading}>{loading ? "Saving..." : "Create property"}</Button>
        </div>
      </form>
    </div>
  );
}
