// Shared type definitions for the PropAI frontend

export type ServiceCategory = 
  | "HVAC"
  | "PLUMBING"
  | "ELECTRICAL"
  | "PEST_CONTROL"
  | "CLEANING"
  | "LANDSCAPING"
  | "GENERAL_REPAIR"
  | "PAINTING"
  | "ROOFING"
  | "SECURITY";

export const serviceCategoryLabels: Record<ServiceCategory, string> = {
  HVAC: "HVAC",
  PLUMBING: "Plumbing", 
  ELECTRICAL: "Electrical",
  PEST_CONTROL: "Pest Control",
  CLEANING: "Cleaning",
  LANDSCAPING: "Landscaping",
  GENERAL_REPAIR: "General Repair",
  PAINTING: "Painting",
  ROOFING: "Roofing",
  SECURITY: "Security"
};

export type MaintenanceRequest = {
  id: string;
  title: string;
  description?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    label: string;
  };
  vendor?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  vendorAssignedAt?: string;
};

export type Vendor = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  serviceCategories: ServiceCategory[];
  trade?: string;
  isActive: boolean;
  maintenanceRequestCount: number;
  maintenanceRequests?: MaintenanceRequest[];
  createdAt: string;
  updatedAt: string;
};

export type Property = {
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
  createdAt: string;
  updatedAt: string;
};

export type Unit = {
  id: string;
  label: string;
  propertyId: string;
  property?: Property;
  rentAmount?: number;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};