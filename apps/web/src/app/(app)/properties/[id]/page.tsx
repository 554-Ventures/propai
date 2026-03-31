"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api";
import { Button } from "../../../../components/ui/button";

type Property = {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes?: string | null;
};

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  const [form, setForm] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<Property>(`/properties/${propertyId}`, { auth: true });
        setForm(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load property");
      }
    };

    if (propertyId) {
      void load();
    }
  }, [propertyId]);

  const update = (key: keyof Property, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setLoading(true);
    setError(null);

    try {
      const updated = await apiFetch<Property>(`/properties/${propertyId}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify(form)
      });
      setForm(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update property");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Delete this property?")) return;
    setLoading(true);
    try {
      await apiFetch(`/properties/${propertyId}`, { method: "DELETE", auth: true });
      router.push("/properties");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete property");
    } finally {
      setLoading(false);
    }
  };

  if (!form) {
    return <p className="text-sm text-slate-400">Loading property...</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{form.name}</h2>
          <p className="text-sm text-slate-400">Update address and portfolio notes.</p>
        </div>
        <Button variant="destructive" onClick={onDelete} disabled={loading}>
          Delete
        </Button>
      </div>

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
            value={form.addressLine2 ?? ""}
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
            value={form.notes ?? ""}
            onChange={(event) => update("notes", event.target.value)}
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
