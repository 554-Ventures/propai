"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArchiveConfirmModal } from "@/components/ArchiveConfirmModal";

type Property = {
  id: string;
  name: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  unitCount?: number;
  vacancyCount?: number;
  archivedAt?: string | null;
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archiveModalProperty, setArchiveModalProperty] = useState<Property | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const filteredProperties = properties.filter(property => {
    if (showArchived) {
      return !!property.archivedAt;
    }
    return !property.archivedAt;
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch<Property[]>("/properties", { auth: true });
        setProperties(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "We couldn't load your properties.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const handleArchiveAction = async () => {
    if (!archiveModalProperty) return;
    
    setArchiveLoading(true);
    setError(null);
    
    try {
      const endpoint = archiveModalProperty.archivedAt 
        ? `/properties/${archiveModalProperty.id}/unarchive`
        : `/properties/${archiveModalProperty.id}/archive`;
      
      await apiFetch(endpoint, { 
        method: "POST", 
        auth: true 
      });
      
      // Refresh the properties list
      const data = await apiFetch<Property[]>("/properties", { auth: true });
      setProperties(data);
      
      const action = archiveModalProperty.archivedAt ? "unarchived" : "archived";
      showToast(`Property ${action} successfully.`);
      
      setArchiveModalProperty(null);
    } catch (err: unknown) {
      const code = (err as { code?: string; message?: string })?.code;
      if (code === "PROPERTY_HAS_ACTIVE_LEASES") {
        setError("Cannot archive property with active leases. End all leases first.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to archive property.");
      }
    } finally {
      setArchiveLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Properties</h2>
          <p className="text-sm text-slate-400">Track assets, unit counts, and performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button
              className={`rounded-full border px-4 py-2 text-sm ${
                !showArchived
                  ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-200"
                  : "border-slate-700/70 text-slate-300 hover:border-slate-600"
              }`}
              onClick={() => setShowArchived(false)}
            >
              Active
            </button>
            <button
              className={`rounded-full border px-4 py-2 text-sm ${
                showArchived
                  ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-200"
                  : "border-slate-700/70 text-slate-300 hover:border-slate-600"
              }`}
              onClick={() => setShowArchived(true)}
            >
              Archived
            </button>
          </div>
          <Button asChild>
            <Link href="/properties/new">Add Property</Link>
          </Button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
      {successMessage && <p className="mt-4 text-sm text-emerald-300">{successMessage}</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {loading &&
          Array.from({ length: 2 }).map((_, index) => (
            <div
              key={`loading-${index}`}
              className="h-28 animate-pulse rounded-2xl border border-slate-800/60 bg-slate-950/40"
            />
          ))}
        {filteredProperties.map((property) => (
          <div
            key={property.id}
            className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <Link
                href={`/properties/${property.id}`}
                className="flex-1 transition hover:opacity-80"
              >
                <h3 className="text-lg font-semibold text-slate-100">{property.name}</h3>
                <p className="mt-2 text-sm text-slate-400">
                  {property.addressLine1}, {property.city}, {property.state} {property.postalCode}
                </p>
                {(property.unitCount !== undefined || property.vacancyCount !== undefined) && (
                  <p className="mt-2 text-xs text-slate-500">
                    {property.unitCount ?? 0} unit{(property.unitCount ?? 0) !== 1 ? "s" : ""}
                    {" · "}
                    {property.vacancyCount ?? 0} vacant
                  </p>
                )}
              </Link>
              
              <div className="flex shrink-0 items-center gap-2">
                {property.archivedAt && (
                  <span className="rounded-full bg-slate-800/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Archived
                  </span>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setArchiveModalProperty(property)}
                  disabled={archiveLoading}
                >
                  {property.archivedAt ? "Unarchive" : "Archive"}
                </Button>
              </div>
            </div>
          </div>
        ))}

        {filteredProperties.length === 0 && !error && !loading && (
          <div className="rounded-2xl border border-dashed border-slate-700/70 p-6 text-sm text-slate-400">
            {showArchived 
              ? "No archived properties. Archive properties to organize your portfolio."
              : "No active properties yet. Add your first property to begin tracking units and tenants."
            }
          </div>
        )}
      </div>

      {archiveModalProperty && (
        <ArchiveConfirmModal
          property={archiveModalProperty}
          onClose={() => setArchiveModalProperty(null)}
          onConfirm={handleArchiveAction}
        />
      )}
    </div>
  );
}
