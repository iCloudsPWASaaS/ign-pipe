"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { money, shortDate } from "@/lib/format";
import { PropertyPicker, type PropertyOption } from "@/components/property-picker";

export type LedgerField = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "time" | "textarea" | "select";
  lookup?: "properties" | "reporters" | "contractors" | "suppliers" | "accounts" | "departments";
  options?: { value: string | number; label: string }[];
  required?: boolean;
  span?: 1 | 2 | 3;
};

export type LedgerColumn = {
  key: string;
  label: string;
  format?: "money" | "date" | "badge";
};

export type LookupData = {
  properties: Record<string, unknown>[];
  reporters: Record<string, unknown>[];
  contractors: Record<string, unknown>[];
  suppliers: Record<string, unknown>[];
  accounts: Record<string, unknown>[];
  departments: Record<string, unknown>[];
};

export function LedgerManager({
  endpoint,
  pk,
  fields,
  columns,
  initialRows,
  lookups,
}: {
  endpoint: string;
  pk: string;
  fields: LedgerField[];
  columns: LedgerColumn[];
  initialRows: Record<string, unknown>[];
  lookups: LookupData;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(needle)),
    );
  }, [rows, query]);

  function optionsFor(field: LedgerField) {
    if (field.options) return field.options;
    if (!field.lookup) return [];
    const data = lookups[field.lookup];
    if (field.lookup === "properties") {
      return data.map((row) => ({
        value: String(row.p_id ?? ""),
        label: [row.p_no, row.p_name, row.p_location].map((v) => String(v ?? "")).filter(Boolean).join(", "),
      }));
    }
    if (field.lookup === "reporters") {
      return data.map((row) => ({ value: String(row.r_id ?? ""), label: String(row.reporter ?? "") }));
    }
    if (field.lookup === "contractors") {
      return data.map((row) => ({ value: String(row.c_id ?? ""), label: String(row.contractor ?? "") }));
    }
    if (field.lookup === "suppliers") {
      return data.map((row) => ({ value: String(row.s_code ?? ""), label: String(row.supplier ?? "") }));
    }
    if (field.lookup === "accounts") {
      return data.map((row) => ({
        value: String(row.n_code ?? ""),
        label: `${String(row.n_code ?? "")} · ${String(row.nominal ?? "")}`,
      }));
    }
    return data.map((row) => ({ value: String(row.d_code ?? ""), label: String(row.name ?? "") }));
  }

  async function refresh() {
    const res = await fetch(`${endpoint}?limit=500`);
    const data = (await res.json()) as { data?: Record<string, unknown>[] };
    if (res.ok && data.data) setRows(data.data);
    router.refresh();
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    for (const field of fields) payload[field.name] = form.get(field.name);

    const isEdit = Boolean(editing);
    const url = isEdit ? `${endpoint}/${encodeURIComponent(String(editing![pk]))}` : endpoint;
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not save");
      return;
    }
    setEditing(null);
    setCreating(false);
    await refresh();
  }

  async function remove(row: Record<string, unknown>) {
    if (!confirm("Delete this record?")) return;
    setBusy(true);
    const res = await fetch(`${endpoint}/${encodeURIComponent(String(row[pk]))}`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not delete");
      return;
    }
    await refresh();
  }

  function display(row: Record<string, unknown>, column: LedgerColumn) {
    const value = row[column.key];
    if (column.format === "money") return money(value);
    if (column.format === "date") return shortDate(value);
    return String(value ?? "—");
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search records..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={() => { setCreating(true); setEditing(null); setError(""); }}>
              <Plus className="h-4 w-4" />
              New entry
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{pk}</th>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={String(row[pk])}>
                  <td className="font-mono text-xs text-slate-500">{String(row[pk] ?? "")}</td>
                  {columns.map((column) => (
                    <td key={column.key} className="max-w-[260px] truncate">{display(row, column)}</td>
                  ))}
                  <td>
                    <div className="flex justify-end gap-1">
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(row); setCreating(false); setError(""); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(row)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? <div className="empty-state">No records yet.</div> : null}
      </div>

      {creating || editing ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-pipe-ink/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="text-lg font-black text-pipe-ink">{editing ? "Edit entry" : "New entry"}</div>
              <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(null); setCreating(false); }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={save} className="p-5">
              {error ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>
              ) : null}
              <div className="field-grid">
                {fields.map((field) => {
                  const span =
                    field.span === 3 ? "md:col-span-2 xl:col-span-3" : field.span === 2 ? "md:col-span-2" : "";
                  const value = editing?.[field.name];
                  return (
                    <div key={field.name} className={span}>
                      <label className="label">{field.label}{field.required ? <span className="ml-1 text-red-500">*</span> : null}</label>
                      {field.lookup === "properties" ? (
                        <PropertyPicker
                          name={field.name}
                          initialProperty={
                            (lookups.properties.find((row) => String(row.p_id) === String(value ?? "")) as
                              | PropertyOption
                              | undefined) ?? null
                          }
                        />
                      ) : field.type === "select" ? (
                        <select className="select" name={field.name} defaultValue={value === null || value === undefined ? "" : String(value)}>
                          <option value="">—</option>
                          {optionsFor(field).map((option) => (
                            <option key={String(option.value)} value={String(option.value)}>{option.label}</option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea className="textarea" name={field.name} defaultValue={value === null || value === undefined ? "" : String(value)} />
                      ) : (
                        <input
                          className="input"
                          name={field.name}
                          type={field.type || "text"}
                          defaultValue={
                            field.type === "date" && value
                              ? String(value).slice(0, 10)
                              : field.type === "time" && value
                                ? String(value).slice(0, 5)
                                : value === null || value === undefined
                                  ? ""
                                  : String(value)
                          }
                          required={field.required}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => { setEditing(null); setCreating(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {busy ? "Saving..." : "Save entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
