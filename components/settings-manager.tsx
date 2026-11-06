"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { EntityDef, FieldDef } from "@/lib/settings-config";

type Row = Record<string, unknown>;

export function SettingsManager({
  entityKey,
  def,
  initialRows,
}: {
  entityKey: string;
  def: EntityDef;
  initialRows: Row[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      def.searchable.some((key) =>
        String(row[key] ?? "")
          .toLowerCase()
          .includes(needle),
      ),
    );
  }, [rows, query, def.searchable]);

  const displayFields = def.fields.slice(0, 6);

  async function refresh() {
    const res = await fetch(`/api/settings/${entityKey}?limit=500`);
    const data = (await res.json()) as { data?: Row[]; error?: string };
    if (res.ok && data.data) setRows(data.data);
    router.refresh();
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    for (const field of def.fields) payload[field.name] = form.get(field.name);

    const isEdit = Boolean(editing);
    const id = editing ? editing[def.pk] : null;
    const url = isEdit
      ? `/api/settings/${entityKey}/${encodeURIComponent(String(id))}`
      : `/api/settings/${entityKey}`;

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

  async function remove(row: Row) {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    setBusy(true);
    const res = await fetch(
      `/api/settings/${entityKey}/${encodeURIComponent(String(row[def.pk]))}`,
      { method: "DELETE" },
    );
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      alert(data.error || "Could not delete");
      return;
    }
    await refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder={`Search ${def.title.toLowerCase()}...`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setCreating(true);
              setEditing(null);
              setError("");
            }}
          >
            <Plus className="h-4 w-4" />
            New record
          </button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{def.pk}</th>
                {displayFields.map((field) => (
                  <th key={field.name}>{field.label}</th>
                ))}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={String(row[def.pk])}>
                  <td className="font-mono text-xs text-slate-500">{String(row[def.pk] ?? "")}</td>
                  {displayFields.map((field) => (
                    <td key={field.name} className="max-w-[260px] truncate">
                      {String(row[field.name] ?? "—")}
                    </td>
                  ))}
                  <td>
                    <div className="flex justify-end gap-1">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setEditing(row);
                          setCreating(false);
                          setError("");
                        }}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => remove(row)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">No {def.title.toLowerCase()} found.</div>
        ) : null}
      </div>

      {creating || editing ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-pipe-ink/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <div className="text-lg font-black text-pipe-ink">
                  {editing ? `Edit ${def.title.replace(/s$/, "")}` : `New ${def.title.replace(/s$/, "")}`}
                </div>
                <div className="text-xs text-slate-500">Fields mirror the legacy CRM columns.</div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditing(null);
                  setCreating(false);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={save} className="p-5">
              {error ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {error}
                </div>
              ) : null}
              <div className="field-grid">
                {def.fields.map((field) => (
                  <Field
                    key={field.name}
                    field={field}
                    value={editing ? editing[field.name] : undefined}
                  />
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditing(null);
                    setCreating(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {busy ? "Saving..." : "Save record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ field, value }: { field: FieldDef; value: unknown }) {
  const span =
    field.span === 3
      ? "md:col-span-2 xl:col-span-3"
      : field.span === 2
        ? "md:col-span-2"
        : "";

  return (
    <div className={span}>
      <label className="label" htmlFor={field.name}>
        {field.label}
        {field.required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      {field.type === "select" ? (
        <select
          id={field.name}
          name={field.name}
          className="select"
          defaultValue={value === null || value === undefined ? "" : String(value)}
        >
          <option value="">—</option>
          {field.options?.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          id={field.name}
          name={field.name}
          className="textarea"
          defaultValue={value === null || value === undefined ? "" : String(value)}
          placeholder={field.placeholder}
        />
      ) : (
        <input
          id={field.name}
          name={field.name}
          type={field.type || "text"}
          className="input"
          defaultValue={
            field.type === "date" && value
              ? String(value).slice(0, 10)
              : value === null || value === undefined
                ? ""
                : String(value)
          }
          placeholder={field.placeholder}
          required={field.required}
        />
      )}
    </div>
  );
}
