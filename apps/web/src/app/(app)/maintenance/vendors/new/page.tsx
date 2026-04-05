"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ServiceCategory, serviceCategoryLabels } from "@/lib/types";

export default function NewVendorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    trade: "",
    serviceCategories: [] as ServiceCategory[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error("Vendor name is required");
      }
      if (formData.serviceCategories.length === 0) {
        throw new Error("At least one service category is required");
      }

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        trade: formData.trade.trim() || undefined,
        serviceCategories: formData.serviceCategories
      };

      await apiFetch("/vendors", {
        method: "POST",
        body: JSON.stringify(payload),
        auth: true,
      });

      router.push("/maintenance?success=vendor-created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vendor");
    } finally {
      setLoading(false);
    }
  };

  const handleServiceCategoryToggle = (category: ServiceCategory) => {
    setFormData(prev => ({
      ...prev,
      serviceCategories: prev.serviceCategories.includes(category)
        ? prev.serviceCategories.filter(c => c !== category)
        : [...prev.serviceCategories, category]
    }));
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/maintenance"
          className="text-slate-400 hover:text-slate-300 transition-colors"
        >
          ← Back to Vendors
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold">Add New Vendor</h2>
        <p className="text-sm text-slate-400 mt-1">
          Add a contractor or service provider to your vendor directory.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
            Vendor Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder-slate-400 focus:border-cyan-400/70 focus:outline-none focus:ring-1 focus:ring-cyan-400/70"
            placeholder="ABC Plumbing & Heating"
            required
          />
        </div>

        <div>
          <label htmlFor="trade" className="block text-sm font-medium text-slate-300 mb-2">
            Trade/Specialty
          </label>
          <input
            type="text"
            id="trade"
            value={formData.trade}
            onChange={(e) => setFormData(prev => ({ ...prev, trade: e.target.value }))}
            className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder-slate-400 focus:border-cyan-400/70 focus:outline-none focus:ring-1 focus:ring-cyan-400/70"
            placeholder="Licensed Plumber"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder-slate-400 focus:border-cyan-400/70 focus:outline-none focus:ring-1 focus:ring-cyan-400/70"
              placeholder="contact@vendor.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder-slate-400 focus:border-cyan-400/70 focus:outline-none focus:ring-1 focus:ring-cyan-400/70"
              placeholder="+1-555-123-4567"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Service Categories *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(serviceCategoryLabels).map(([key, label]) => {
              const category = key as ServiceCategory;
              const isSelected = formData.serviceCategories.includes(category);
              
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleServiceCategoryToggle(category)}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-200"
                      : "border-slate-700/70 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {formData.serviceCategories.length === 0 && (
            <p className="mt-2 text-sm text-slate-500">
              Select at least one service category
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading || formData.serviceCategories.length === 0}>
            {loading ? "Creating..." : "Create Vendor"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}