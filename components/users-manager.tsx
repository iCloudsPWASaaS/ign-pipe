"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

type Row = Record<string, unknown>;

const roles = [
  { value: 1, label: "Administrator" },
  { value: 2, label: "Staff" },
  { value: 3, label: "Contractor" },
];

export function UsersManager({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    const res = await fetch("/api/users");
    const data = (await res.json()) as { data?: Row[] };
    if (res.ok && data.data) setRows(data.data);
    router.refresh();
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const isEdit = Boolean(editing);
    const res = await fetch(isEdit ? `/api/users/${editing!.id}` : "/api/users", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not save user");
      return;
    }
    setEditing(null);
    setCreating(false);
    await refresh();
  }

  async function remove(row: Row) {
    if (!confirm("Delete this user?")) return;
    setBusy(true);
    const res = await fetch(`/api/users/${row.id}`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not delete user");
      return;
    }
    await refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn btn-primary" onClick={() => { setCreating(true); setEditing(null); setError(""); }}>
          <Plus className="h-4 w-4" />
          New user
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)}>
                  <td className="font-mono text-xs text-slate-500">{String(row.id)}</td>
                  <td className="font-semibold">{String(row.name)}</td>
                  <td>{String(row.user)}</td>
                  <td>{String(row.email ?? "")}</td>
                  <td>{String(row.phone ?? "")}</td>
                  <td>{roles.find((role) => role.value === Number(row.role))?.label ?? String(row.role)}</td>
                  <td><StatusBadge value={Number(row.status) === 1 ? "Active" : "Inactive"} /></td>
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
        {rows.length === 0 ? <div className="empty-state">No users found.</div> : null}
      </div>

      {creating || editing ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-pipe-ink/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="text-lg font-black text-pipe-ink">{editing ? "Edit user" : "New user"}</div>
              <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(null); setCreating(false); }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={save} className="p-5">
              {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div> : null}
              <div className="field-grid">
                <Field label="Name" name="name" value={editing?.name} required />
                <Field label="Username" name="user" value={editing?.user} required />
                <Field label="Password" name="pass" value={editing?.pass} required />
                <Field label="Email" name="email" value={editing?.email} type="email" />
                <Field label="Phone" name="phone" value={editing?.phone} />
                <Field label="Salary" name="salary" value={editing?.salary} type="number" />
                <Field label="Join date" name="joindate" value={editing?.joindate} type="date" />
                <Field label="Label" name="label" value={editing?.label} />
                <div>
                  <label className="label">Role</label>
                  <select className="select" name="role" defaultValue={String(editing?.role ?? 2)}>
                    {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="select" name="status" defaultValue={String(editing?.status ?? 1)}>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => { setEditing(null); setCreating(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {busy ? "Saving..." : "Save user"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  name,
  value,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  value: unknown;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</label>
      <input
        className="input"
        name={name}
        type={type}
        required={required}
        defaultValue={
          type === "date" && value
            ? String(value).slice(0, 10)
            : value === null || value === undefined
              ? ""
              : String(value)
        }
      />
    </div>
  );
}
