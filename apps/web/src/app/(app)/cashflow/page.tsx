"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Property = {
  id: string;
  name: string;
};

type CashflowType = "INCOME" | "EXPENSE";

type CashflowTransaction = {
  id: string;
  type: CashflowType;
  amount: number;
  date: string;
  category: string;
  notes?: string | null;
  propertyId?: string | null;
  property?: { id: string; name: string } | null;
};

type TabKey = "all" | "income" | "expenses";

function toISODate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getMonthToDateRange(now = new Date()) {
  const start = new Date(now);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { from: toISODate(start), to: toISODate(end) };
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function friendlyError(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function CashflowPage() {
  const [tab, setTab] = useState<TabKey>("all");
  const [transactions, setTransactions] = useState<CashflowTransaction[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const mtd = useMemo(() => getMonthToDateRange(), []);
  const [from, setFrom] = useState(mtd.from);
  const [to, setTo] = useState(mtd.to);
  const [propertyId, setPropertyId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    type: "EXPENSE" as CashflowType,
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    category: "",
    propertyId: "",
    notes: ""
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (propertyId) params.set("propertyId", propertyId);
      if (tab === "income") params.set("type", "income");
      if (tab === "expenses") params.set("type", "expense");

      const [tx, props] = await Promise.all([
        apiFetch<CashflowTransaction[]>(`/cashflow/transactions?${params.toString()}`, { auth: true }),
        apiFetch<Property[]>("/properties", { auth: true }).catch(() => [])
      ]);
      setTransactions(tx);
      setProperties(props);
    } catch (err) {
      setError(friendlyError(err, "We couldn't load cashflow transactions."));
    } finally {
      setLoading(false);
    }
  }, [from, propertyId, tab, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  const filtersActive = useMemo(() => {
    return tab !== "all" || propertyId !== "" || from !== mtd.from || to !== mtd.to;
  }, [from, mtd.from, mtd.to, propertyId, tab, to]);

  const clearFilters = () => {
    setTab("all");
    setPropertyId("");
    setFrom(mtd.from);
    setTo(mtd.to);
  };

  const updateForm = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm({
      type: "EXPENSE",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      category: "",
      propertyId: "",
      notes: ""
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        type: form.type,
        amount: Number(form.amount),
        date: form.date,
        category: form.category,
        propertyId: form.propertyId || undefined,
        notes: form.notes || undefined
      };
      await apiFetch<CashflowTransaction>("/cashflow/transactions", {
        method: "POST",
        auth: true,
        body: JSON.stringify(payload)
      });
      // Re-load so the list stays consistent with the current filters (date range / property / type).
      await load();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      setError(friendlyError(err, "We couldn't save that transaction."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Cashflow</h2>
          <p className="text-sm text-slate-400">Track income & expenses across your portfolio.</p>
        </div>

        <Button
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
        >
          Add transaction
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: "all" as const, label: "All" },
            { key: "income" as const, label: "Income" },
            { key: "expenses" as const, label: "Expenses" }
          ] satisfies { key: TabKey; label: string }[]
        ).map((item) => (
          <button
            key={item.key}
            className={`rounded-xl border px-3 py-2 text-sm transition ${
              tab === item.key
                ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-100"
                : "border-slate-800/70 bg-slate-950/40 text-slate-200 hover:border-slate-600/70"
            }`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">From</label>
          <input
            type="date"
            className="mt-2 w-full rounded-xl border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">To</label>
          <input
            type="date"
            className="mt-2 w-full rounded-xl border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="min-w-[220px] flex-1">
          <label className="text-xs uppercase tracking-wide text-slate-400">Property</label>
          <select
            className="mt-2 w-full rounded-xl border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            <option value="">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="secondary" onClick={clearFilters} disabled={!filtersActive || loading}>
          Clear filters
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>{error}</div>
            <Button type="button" variant="secondary" onClick={load} disabled={loading}>
              Retry
            </Button>
          </div>
        </div>
      )}

      <section className="grid gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4 sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Income</div>
          <div className="mt-1 text-lg font-semibold text-emerald-200">{formatMoney(totals.income)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Expenses</div>
          <div className="mt-1 text-lg font-semibold text-rose-200">{formatMoney(totals.expense)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Net</div>
          <div
            className={`mt-1 text-lg font-semibold ${
              totals.net >= 0 ? "text-emerald-200" : "text-rose-200"
            }`}
          >
            {formatMoney(totals.net)}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800/70 bg-slate-950/40">
        <div className="grid grid-cols-[140px_1fr_1fr_44px_140px] gap-3 border-b border-slate-800/70 px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
          <div>Date</div>
          <div>Category</div>
          <div>Property</div>
          <div className="text-center">Notes</div>
          <div className="text-right">Amount</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-400">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-400">
            {filtersActive ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>No transactions match your current filters.</div>
                <Button type="button" variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              "No transactions yet."
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {transactions.map((t) => {
              const isIncome = t.type === "INCOME";
              const signed = isIncome ? Math.abs(t.amount) : -Math.abs(t.amount);
              const amountLabel = `${signed >= 0 ? "+" : "-"}${formatMoney(Math.abs(signed))}`;
              const propertyName = t.property?.name ?? properties.find((p) => p.id === t.propertyId)?.name ?? "—";
              const hasNotes = Boolean(t.notes && t.notes.trim().length);
              return (
                <div
                  key={t.id}
                  className="grid grid-cols-[140px_1fr_1fr_44px_140px] items-center gap-3 px-4 py-3 text-sm"
                >
                  <div className="text-slate-300">{new Date(t.date).toLocaleDateString()}</div>
                  <div className="min-w-0 truncate text-slate-100">{t.category}</div>
                  <div className="min-w-0 truncate text-slate-300">{propertyName}</div>
                  <div className="flex justify-center">
                    {hasNotes ? (
                      <span
                        title={t.notes ?? undefined}
                        className="inline-flex h-2 w-2 rounded-full bg-cyan-300/80"
                        aria-label="Has notes"
                      />
                    ) : (
                      <span className="inline-flex h-2 w-2 rounded-full bg-slate-700/60" aria-label="No notes" />
                    )}
                  </div>
                  <div className={`text-right font-medium ${isIncome ? "text-emerald-300" : "text-rose-300"}`}>
                    {amountLabel}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              if (!submitting) setModalOpen(false);
            }}
          />

          <div className="relative w-full max-w-lg rounded-3xl border border-slate-700/70 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Add transaction</h3>
                <p className="text-xs text-slate-400">Income or expense. Category is free text for now.</p>
              </div>
              <button
                className="rounded-xl border border-slate-800/70 bg-slate-900/40 px-3 py-2 text-xs text-slate-200"
                onClick={() => {
                  if (!submitting) setModalOpen(false);
                }}
              >
                Close
              </button>
            </div>

            <form onSubmit={submit} className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400">Type</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
                    value={form.type}
                    onChange={(e) => updateForm("type", e.target.value as CashflowType)}
                  >
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400">Amount</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
                    value={form.amount}
                    onChange={(e) => updateForm("amount", e.target.value)}
                    placeholder="1200.00"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400">Date</label>
                  <input
                    type="date"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
                    value={form.date}
                    onChange={(e) => updateForm("date", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400">Category</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
                    value={form.category}
                    onChange={(e) => updateForm("category", e.target.value)}
                    placeholder={form.type === "INCOME" ? "Rent" : "Repairs"}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-slate-400">Property (optional)</label>
                <select
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
                  value={form.propertyId}
                  onChange={(e) => updateForm("propertyId", e.target.value)}
                >
                  <option value="">No property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-slate-400">Notes (optional)</label>
                <textarea
                  className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (!submitting) {
                      setModalOpen(false);
                      resetForm();
                    }
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
