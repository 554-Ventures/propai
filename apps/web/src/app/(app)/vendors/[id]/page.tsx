"use client";

export const runtime = "edge";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ServiceCategory, MaintenanceRequest, Vendor, serviceCategoryLabels } from "@/lib/types";

export default function VendorDetailPage() {
  const params = useParams();
  const vendorId = params.id as string;
  
  const [vendor, setVendor] = useState<Vendor & { maintenanceRequests: MaintenanceRequest[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    trade: "",
    serviceCategories: [] as ServiceCategory[],
    isActive: true
  });

  const showToast = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const loadVendor = useCallback(async () => {
    try {
      const data = await apiFetch<Vendor & { maintenanceRequests: MaintenanceRequest[] }>(`/vendors/${vendorId}`, { auth: true });
      setVendor(data);
      setEditForm({
        name: data.name,
        email: data.email || "",
        phone: data.phone || "",
        trade: data.trade || "",
        serviceCategories: data.serviceCategories,
        isActive: data.isActive
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendor");
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    loadVendor();
  }, [loadVendor]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setError(null);

    try {
      if (!editForm.name.trim()) {
        throw new Error("Vendor name is required");
      }
      if (editForm.serviceCategories.length === 0) {
        throw new Error("At least one service category is required");
      }

      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        trade: editForm.trade.trim() || undefined,
        serviceCategories: editForm.serviceCategories,
        isActive: editForm.isActive
      };

      await apiFetch(`/vendors/${vendorId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        auth: true,
      });

      await loadVendor(); // Reload to get updated data
      setIsEditing(false);
      showToast("Vendor updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update vendor");
    } finally {
      setEditLoading(false);
    }
  };

  const handleServiceCategoryToggle = (category: ServiceCategory) => {
    setEditForm(prev => ({
      ...prev,
      serviceCategories: prev.serviceCategories.includes(category)
        ? prev.serviceCategories.filter(c => c !== category)
        : [...prev.serviceCategories, category]
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-800"></div>
        <div className="h-32 animate-pulse rounded-2xl border border-slate-800/60 bg-slate-950/40"></div>
      </div>
    );
  }

  if (error && !vendor) {
    return (
      <div>
        <Link
          href="/vendors"
          className="text-slate-400 hover:text-slate-300 transition-colors mb-6 inline-block"
        >
          ← Back to Vendors
        </Link>
        <div className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-4 text-rose-300">
          {error}
        </div>
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/vendors"
          className="text-slate-400 hover:text-slate-300 transition-colors"
        >
          ← Back to Vendors
        </Link>
        
        <div className="flex gap-3">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              Edit Vendor
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                form="vendor-edit-form" 
                type="submit" 
                disabled={editLoading}
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                  // Reset form to original values
                  setEditForm({
                    name: vendor.name,
                    email: vendor.email || "",
                    phone: vendor.phone || "",
                    trade: vendor.trade || "",
                    serviceCategories: vendor.serviceCategories,
                    isActive: vendor.isActive
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-300">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-rose-400/30 bg-rose-400/10 p-4 text-rose-300">
          {error}
        </div>
      )}

      {!isEditing ? (
        <div className="space-y-6">
          {/* Vendor Info */}
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl font-bold text-slate-100">{vendor.name}</h1>
                  <span className={`rounded-full px-3 py-1 text-sm ${
                    vendor.isActive 
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-slate-700/50 text-slate-400"
                  }`}>
                    {vendor.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {vendor.trade && (
                  <p className="text-lg text-slate-300 mb-4">{vendor.trade}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {vendor.email && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <span>📧</span>
                      <a href={`mailto:${vendor.email}`} className="hover:text-cyan-300">
                        {vendor.email}
                      </a>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <span>📞</span>
                      <a href={`tel:${vendor.phone}`} className="hover:text-cyan-300">
                        {vendor.phone}
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Service Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {vendor.serviceCategories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200"
                      >
                        {serviceCategoryLabels[category]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Maintenance Requests */}
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">
              Recent Maintenance Requests ({vendor.maintenanceRequestCount})
            </h2>
            
            {vendor.maintenanceRequests.length === 0 ? (
              <p className="text-slate-400">No maintenance requests assigned to this vendor yet.</p>
            ) : (
              <div className="space-y-3">
                {vendor.maintenanceRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-200">{request.title}</h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {request.property.name}
                          {request.unit && ` • Unit ${request.unit.label}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        request.status === "COMPLETED"
                          ? "bg-emerald-400/10 text-emerald-300"
                          : request.status === "IN_PROGRESS"
                          ? "bg-yellow-400/10 text-yellow-300"
                          : "bg-slate-700/50 text-slate-400"
                      }`}>
                        {request.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Edit Form */
        <form onSubmit={handleEdit} id="vendor-edit-form" className="space-y-6">
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-6">Edit Vendor Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-slate-300 mb-2">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder-slate-400 focus:border-cyan-400/70 focus:outline-none focus:ring-1 focus:ring-cyan-400/70"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-trade" className="block text-sm font-medium text-slate-300 mb-2">
                  Trade/Specialty
                </label>
                <input
                  type="text"
                  id="edit-trade"
                  value={editForm.trade}
                  onChange={(e) => setEditForm(prev => ({ ...prev, trade: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder-slate-400 focus:border-cyan-400/70 focus:outline-none focus:ring-1 focus:ring-cyan-400/70"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="edit-email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder-slate-400 focus:border-cyan-400/70 focus:outline-none focus:ring-1 focus:ring-cyan-400/70"
                  />
                </div>

                <div>
                  <label htmlFor="edit-phone" className="block text-sm font-medium text-slate-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="edit-phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder-slate-400 focus:border-cyan-400/70 focus:outline-none focus:ring-1 focus:ring-cyan-400/70"
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
                    const isSelected = editForm.serviceCategories.includes(category);
                    
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
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-slate-600 bg-slate-800 text-cyan-400 focus:ring-cyan-400/20"
                />
                <label htmlFor="edit-active" className="text-sm text-slate-300">
                  Active vendor (can receive new assignments)
                </label>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}