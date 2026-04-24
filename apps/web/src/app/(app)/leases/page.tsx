"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { 
  Badge,
  Button,
  Input,
  Label,
  PageHeader,
  Select,
  Skeleton,
  Text
} from "@/components/ui";

type Property = {
  id: string;
  name: string;
};

type Tenant = {
  id: string;
  firstName: string;
  lastName: string;
};

type UnitWithLease = {
  id: string;
  label: string;
  rent?: number | null;
  currentLease?: { id: string } | null;
};

type Lease = {
  id: string;
  startDate: string;
  endDate?: string | null;
  rent: number;
  status: "DRAFT" | "ACTIVE" | "ENDED";
  property: Property;
  unit: UnitWithLease;
  tenant: Tenant;
};

type LeaseStatusFilter = "ALL" | "ACTIVE" | "ENDED" | "DRAFT" | "EXPIRED";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "—";
  return `$${value.toLocaleString()}`;
};

const isExpired = (lease: Lease) => {
  if (!lease.endDate) return false;
  const endDate = new Date(lease.endDate);
  return lease.status === "ACTIVE" && endDate.getTime() < Date.now();
};

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeaseStatusFilter>("ALL");

  const [showLeaseModal, setShowLeaseModal] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [leaseFormError, setLeaseFormError] = useState<string | null>(null);
  const [leaseSaving, setLeaseSaving] = useState(false);

  const [units, setUnits] = useState<UnitWithLease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const [leaseForm, setLeaseForm] = useState({
    propertyId: "",
    unitId: "",
    tenantMode: "select" as "select" | "create",
    tenantId: "",
    newTenant: { firstName: "", lastName: "", email: "", phone: "" },
    startDate: "",
    endDate: "",
    rent: "",
    status: "ACTIVE"
  });

  const [viewLease, setViewLease] = useState<Lease | null>(null);

  const loadProperties = async () => {
    const data = await apiFetch<Property[]>("/properties", { auth: true });
    setProperties(data);
  };

  const loadTenants = async () => {
    const data = await apiFetch<Tenant[]>("/tenants", { auth: true });
    setTenants(data);
  };

  const loadUnits = async (propertyId: string, allowUnitId?: string) => {
    const data = await apiFetch<UnitWithLease[]>(`/properties/${propertyId}/units`, { auth: true });
    setUnits(
      data.filter((unit) => !unit.currentLease || (allowUnitId && unit.id === allowUnitId))
    );
  };

  const loadLeases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (selectedProperty) query.set("propertyId", selectedProperty);

      if (statusFilter !== "ALL" && statusFilter !== "EXPIRED") {
        query.set("status", statusFilter);
      }

      const data = await apiFetch<Lease[]>(`/leases${query.toString() ? `?${query}` : ""}`, {
        auth: true
      });

      const filtered =
        statusFilter === "EXPIRED" ? data.filter((lease) => isExpired(lease)) : data;
      setLeases(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leases.");
    } finally {
      setLoading(false);
    }
  }, [selectedProperty, statusFilter]);

  useEffect(() => {
    void loadProperties();
    void loadTenants();
  }, []);

  useEffect(() => {
    void loadLeases();
  }, [loadLeases]);

  const openCreateModal = () => {
    setEditingLease(null);
    setLeaseFormError(null);
    setLeaseForm({
      propertyId: "",
      unitId: "",
      tenantMode: "select",
      tenantId: "",
      newTenant: { firstName: "", lastName: "", email: "", phone: "" },
      startDate: "",
      endDate: "",
      rent: "",
      status: "ACTIVE"
    });
    setUnits([]);
    setShowLeaseModal(true);
  };

  const openEditModal = async (lease: Lease) => {
    setEditingLease(lease);
    setLeaseFormError(null);
    setLeaseForm({
      propertyId: lease.property.id,
      unitId: lease.unit.id,
      tenantMode: "select",
      tenantId: lease.tenant.id,
      newTenant: { firstName: "", lastName: "", email: "", phone: "" },
      startDate: lease.startDate.slice(0, 10),
      endDate: lease.endDate ? lease.endDate.slice(0, 10) : "",
      rent: String(lease.rent ?? ""),
      status: lease.status
    });
    await loadUnits(lease.property.id, lease.unit.id);
    setShowLeaseModal(true);
  };

  const selectedUnit = useMemo(
    () => units.find((unit) => unit.id === leaseForm.unitId) ?? null,
    [units, leaseForm.unitId]
  );

  const submitLease = async (event: React.FormEvent) => {
    event.preventDefault();
    setLeaseFormError(null);

    if (!leaseForm.propertyId || !leaseForm.unitId) {
      setLeaseFormError("Select a property and unit.");
      return;
    }

    if (!leaseForm.startDate) {
      setLeaseFormError("Start date is required.");
      return;
    }

    let tenantId = leaseForm.tenantId;

    if (leaseForm.tenantMode === "create") {
      if (!leaseForm.newTenant.firstName || !leaseForm.newTenant.lastName) {
        setLeaseFormError("First and last name are required.");
        return;
      }

      setLeaseSaving(true);
      try {
        const created = await apiFetch<Tenant>("/tenants", {
          method: "POST",
          auth: true,
          body: JSON.stringify(leaseForm.newTenant)
        });
        setTenants((prev) => [created, ...prev]);
        tenantId = created.id;
      } catch (err) {
        setLeaseSaving(false);
        setLeaseFormError(err instanceof Error ? err.message : "Failed to create tenant");
        return;
      }
    }

    if (!tenantId) {
      setLeaseFormError("Select a tenant.");
      return;
    }

    setLeaseSaving(true);

    try {
      if (editingLease) {
        await apiFetch(`/leases/${editingLease.id}`, {
          method: "PATCH",
          auth: true,
          body: JSON.stringify({
            propertyId: leaseForm.propertyId,
            unitId: leaseForm.unitId,
            tenantId,
            startDate: leaseForm.startDate,
            endDate: leaseForm.endDate || undefined,
            rent: leaseForm.rent ? Number(leaseForm.rent) : selectedUnit?.rent ?? 0,
            status: leaseForm.status
          })
        });
      } else {
        await apiFetch(`/properties/${leaseForm.propertyId}/units/${leaseForm.unitId}/leases`, {
          method: "POST",
          auth: true,
          body: JSON.stringify({
            tenantId,
            startDate: leaseForm.startDate,
            endDate: leaseForm.endDate || undefined,
            rent: leaseForm.rent ? Number(leaseForm.rent) : selectedUnit?.rent ?? 0,
            status: leaseForm.status
          })
        });
      }

      setShowLeaseModal(false);
      await loadLeases();
    } catch (err) {
      setLeaseFormError(err instanceof Error ? err.message : "Failed to save lease");
    } finally {
      setLeaseSaving(false);
    }
  };

  const endLease = async (lease: Lease) => {
    if (!confirm("End this lease?")) return;
    try {
      await apiFetch(`/leases/${lease.id}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ status: "ENDED" })
      });
      await loadLeases();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end lease");
    }
  };

  return (
    <div>
      <PageHeader
        title="Leases"
        description="Manage active and upcoming leases."
        action={<Button onClick={openCreateModal}>New Lease</Button>}
      />

      <div className="flex flex-wrap gap-3 mb-6">
        <Select
          value={selectedProperty}
          onChange={(event) => setSelectedProperty((event.target as HTMLSelectElement).value)}
        >
          <option value="">All Properties</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </Select>

        <Select
          value={statusFilter}
          onChange={(event) => setStatusFilter((event.target as HTMLSelectElement).value as LeaseStatusFilter)}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ENDED">Ended</option>
          <option value="DRAFT">Draft</option>
          <option value="EXPIRED">Expired</option>
        </Select>
      </div>

      {error && <Text variant="error" size="sm" className="mt-4">{error}</Text>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        <div className="grid grid-cols-7 gap-4 border-b border-border bg-muted/50 px-4 py-3">
          <Text variant="muted" size="xs" weight="medium" className="uppercase tracking-wide">Tenant</Text>
          <Text variant="muted" size="xs" weight="medium" className="uppercase tracking-wide">Property</Text>
          <Text variant="muted" size="xs" weight="medium" className="uppercase tracking-wide">Unit</Text>
          <Text variant="muted" size="xs" weight="medium" className="uppercase tracking-wide">Start</Text>
          <Text variant="muted" size="xs" weight="medium" className="uppercase tracking-wide">End</Text>
          <Text variant="muted" size="xs" weight="medium" className="uppercase tracking-wide">Rent</Text>
          <Text variant="muted" size="xs" weight="medium" className="uppercase tracking-wide">Status</Text>
        </div>
        <div className="divide-y divide-border">
          {loading && (
            <div className="px-4 py-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="grid grid-cols-7 gap-4">
                  <Skeleton size="sm" />
                  <Skeleton size="sm" />
                  <Skeleton size="sm" />
                  <Skeleton size="sm" />
                  <Skeleton size="sm" />
                  <Skeleton size="sm" />
                  <Skeleton size="sm" width="lg" />
                </div>
              ))}
            </div>
          )}
          {!loading && leases.length === 0 && (
            <div className="px-4 py-6">
              <Text variant="muted" size="sm">No leases yet.</Text>
            </div>
          )}
          {leases.map((lease) => (
            <div
              key={lease.id}
              className="grid grid-cols-7 gap-4 px-4 py-4"
            >
              <Text size="sm">
                {lease.tenant.firstName} {lease.tenant.lastName}
              </Text>
              <Text size="sm">{lease.property.name}</Text>
              <Text size="sm">{lease.unit.label}</Text>
              <Text size="sm">{formatDate(lease.startDate)}</Text>
              <Text size="sm">{formatDate(lease.endDate)}</Text>
              <Text size="sm">{formatCurrency(lease.rent)}</Text>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={lease.status === 'ACTIVE' ? 'success' : lease.status === 'ENDED' ? 'secondary' : 'default'}
                  size="sm"
                >
                  {lease.status}
                </Badge>
                {isExpired(lease) && (
                  <Badge variant="warning" size="xs">
                    Expired
                  </Badge>
                )}
              </div>
              <div className="col-span-7 mt-2 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setViewLease(lease)}>
                  View
                </Button>
                <Button variant="secondary" onClick={() => void openEditModal(lease)}>
                  Edit
                </Button>
                {lease.status === "ACTIVE" && (
                  <Button variant="destructive" onClick={() => void endLease(lease)}>
                    End Lease
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showLeaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card/95 backdrop-blur p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <Text as="h4" size="lg" weight="semibold">
                {editingLease ? "Edit Lease" : "Create Lease"}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeaseModal(false)}
              >
                <Text variant="muted" size="sm">Close</Text>
              </Button>
            </div>

            <form onSubmit={submitLease} className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="propertySelect" required>
                  Property
                </Label>
                <select
                  id="propertySelect"
                  className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={leaseForm.propertyId}
                  onChange={async (event) => {
                    const value = event.target.value;
                    setLeaseForm((prev) => ({ ...prev, propertyId: value, unitId: "" }));
                    if (value) {
                      await loadUnits(value, editingLease?.unit.id);
                    } else {
                      setUnits([]);
                    }
                  }}
                  required
                >
                  <option value="">Select property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="unitSelect" required>
                  Unit
                </Label>
                <select
                  id="unitSelect"
                  className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={leaseForm.unitId}
                  onChange={(event) => {
                    const value = event.target.value;
                    const unitRent = units.find((unit) => unit.id === value)?.rent;
                    setLeaseForm((prev) => ({
                      ...prev,
                      unitId: value,
                      rent: unitRent ? String(unitRent) : prev.rent
                    }));
                  }}
                  required
                >
                  <option value="">Select unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={leaseForm.tenantMode === "select" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLeaseForm((prev) => ({ ...prev, tenantMode: "select" }))}
                  >
                    Select Tenant
                  </Button>
                  <Button
                    type="button"
                    variant={leaseForm.tenantMode === "create" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLeaseForm((prev) => ({ ...prev, tenantMode: "create" }))}
                  >
                    Create Tenant
                  </Button>
                </div>
              </div>

              {leaseForm.tenantMode === "select" ? (
                <div className="md:col-span-2">
                  <Label htmlFor="tenantSelect" required>
                    Tenant
                  </Label>
                  <select
                    id="tenantSelect"
                    className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={leaseForm.tenantId}
                    onChange={(event) =>
                      setLeaseForm((prev) => ({ ...prev, tenantId: event.target.value }))
                    }
                  >
                    <option value="">Select tenant</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.firstName} {tenant.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="firstName" required>
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={leaseForm.newTenant.firstName}
                      onChange={(event) =>
                        setLeaseForm((prev) => ({
                          ...prev,
                          newTenant: { ...prev.newTenant, firstName: (event.target as HTMLInputElement).value }
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" required>
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={leaseForm.newTenant.lastName}
                      onChange={(event) =>
                        setLeaseForm((prev) => ({
                          ...prev,
                          newTenant: { ...prev.newTenant, lastName: (event.target as HTMLInputElement).value }
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={leaseForm.newTenant.email}
                      onChange={(event) =>
                        setLeaseForm((prev) => ({
                          ...prev,
                          newTenant: { ...prev.newTenant, email: (event.target as HTMLInputElement).value }
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={leaseForm.newTenant.phone}
                      onChange={(event) =>
                        setLeaseForm((prev) => ({
                          ...prev,
                          newTenant: { ...prev.newTenant, phone: (event.target as HTMLInputElement).value }
                        }))
                      }
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="startDate" required>
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={leaseForm.startDate}
                  onChange={(event) => setLeaseForm((prev) => ({ ...prev, startDate: (event.target as HTMLInputElement).value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={leaseForm.endDate}
                  onChange={(event) => setLeaseForm((prev) => ({ ...prev, endDate: (event.target as HTMLInputElement).value }))}
                />
              </div>
              <div>
                <Label htmlFor="rent">
                  Rent
                </Label>
                <Input
                  id="rent"
                  type="number"
                  min="0"
                  value={leaseForm.rent}
                  onChange={(event) => setLeaseForm((prev) => ({ ...prev, rent: (event.target as HTMLInputElement).value }))}
                />
              </div>
              <div>
                <Label htmlFor="status">
                  Status
                </Label>
                <select
                  id="status"
                  className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={leaseForm.status}
                  onChange={(event) => setLeaseForm((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ENDED">Ended</option>
                </select>
              </div>

              {leaseFormError && (
                <div className="md:col-span-2">
                  <Text variant="error" size="sm">{leaseFormError}</Text>
                </div>
              )}

              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowLeaseModal(false)}>
                  Cancel
                </Button>
                <Button disabled={leaseSaving}>{leaseSaving ? "Saving..." : "Save Lease"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewLease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card/95 backdrop-blur p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <Text as="h4" size="lg" weight="semibold">Lease Details</Text>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewLease(null)}
              >
                <Text variant="muted" size="sm">Close</Text>
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <Text variant="muted" size="sm">Tenant:</Text>
                <Text size="sm">{viewLease.tenant.firstName} {viewLease.tenant.lastName}</Text>
              </div>
              <div className="flex justify-between items-center">
                <Text variant="muted" size="sm">Property:</Text>
                <Text size="sm">{viewLease.property.name}</Text>
              </div>
              <div className="flex justify-between items-center">
                <Text variant="muted" size="sm">Unit:</Text>
                <Text size="sm">{viewLease.unit.label}</Text>
              </div>
              <div className="flex justify-between items-center">
                <Text variant="muted" size="sm">Start Date:</Text>
                <Text size="sm">{formatDate(viewLease.startDate)}</Text>
              </div>
              <div className="flex justify-between items-center">
                <Text variant="muted" size="sm">End Date:</Text>
                <Text size="sm">{formatDate(viewLease.endDate)}</Text>
              </div>
              <div className="flex justify-between items-center">
                <Text variant="muted" size="sm">Rent:</Text>
                <Text size="sm">{formatCurrency(viewLease.rent)}</Text>
              </div>
              <div className="flex justify-between items-center">
                <Text variant="muted" size="sm">Status:</Text>
                <Badge 
                  variant={viewLease.status === 'ACTIVE' ? 'success' : viewLease.status === 'ENDED' ? 'secondary' : 'default'}
                  size="sm"
                >
                  {viewLease.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
