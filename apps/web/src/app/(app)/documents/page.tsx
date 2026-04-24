"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/molecules/page-header";
import { DataCard } from "@/components/ui/molecules/data-card";
import { FormField } from "@/components/ui/molecules/form-field";

const documentTypes = ["LEASE", "RECEIPT", "INSPECTION", "INSURANCE", "TAX", "OTHER"];

type Property = {
  id: string;
  name: string;
};

type Document = {
  id: string;
  name: string;
  type: string;
  url: string;
  createdAt: string;
  propertyId?: string | null;
};

type UploadResponse = {
  document: Document;
  ocr: { insightId: string; text: string } | null;
};

export default function DocumentsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("OTHER");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<Property[]>("/properties", { auth: true });
        setProperties(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load properties");
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = selectedProperty ? `?propertyId=${selectedProperty}` : "";
        const data = await apiFetch<Document[]>(`/api/documents${query}`, { auth: true });
        setDocuments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load documents");
      } finally {
        setLoading(false);
      }
    };
    void loadDocuments();
  }, [selectedProperty]);

  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);

  const handleUpload = async () => {
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (selectedProperty) {
        formData.append("propertyId", selectedProperty);
      }
      formData.append("type", selectedType);
      formData.append("name", file.name);

      const response = await apiFetch<UploadResponse>("/api/documents/upload", {
        method: "POST",
        auth: true,
        body: formData
      });

      setDocuments((prev) => [response.document, ...prev]);
      setSuccess(response.ocr ? "Document uploaded with text extracted." : "Document uploaded.");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Upload leases, receipts, and inspection reports."
      />

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-card-foreground">Upload a document</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormField label="Property">
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={selectedProperty}
                onChange={(event) => setSelectedProperty(event.target.value)}
              >
                <option value="">All properties</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Type">
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
              >
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="File" className="md:col-span-2">
              <input
                type="file"
                className="mt-2 w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </FormField>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload document"}
            </Button>
            {success && <p className="text-xs text-emerald-300">{success}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-card-foreground">Recent uploads</h3>
            <span className="text-xs text-muted-foreground">{documents.length} items</span>
          </div>
          <div className="mt-4 space-y-3">
            {loading && <p className="text-sm text-muted-foreground">Loading documents...</p>}
            {!loading && documents.length === 0 && (
              <p className="text-sm text-muted-foreground">No documents yet. Upload a lease or receipt to get started.</p>
            )}
            {documents.map((doc) => (
              <DataCard
                key={doc.id}
                title={doc.name}
                description={`${doc.type} · ${new Date(doc.createdAt).toLocaleDateString()}`}
                size="sm"
                action={
                  <a
                    href={`${apiUrl}${doc.url}`}
                    className="text-xs text-primary hover:text-primary/80"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                }
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
