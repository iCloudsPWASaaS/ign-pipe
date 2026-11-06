"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, Plus, Save, Trash2, Wrench } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { dateInputValue } from "@/lib/format";

type Detail = Record<string, unknown>;
type Row = Record<string, unknown>;

export function IssueEditor({
  jobNo,
  initialDetails,
  property,
  reporter,
  contractors,
  accounts,
  departments,
  initialParts,
  schedules,
}: {
  jobNo: number;
  initialDetails: Detail[];
  property: Row | null;
  reporter: Row | null;
  contractors: Row[];
  accounts: Row[];
  departments: Row[];
  initialParts: Row[];
  schedules: Row[];
}) {
  const router = useRouter();
  const [details, setDetails] = useState<Detail[]>(initialDetails);
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [parts, setParts] = useState<Row[]>(initialParts);
  const [propertyForm, setPropertyForm] = useState({
    gas: dateInputValue(property?.gas),
    pir: dateInputValue(property?.pir),
    lra: dateInputValue(property?.lra),
    pat: dateInputValue(property?.pat),
    reg: dateInputValue(property?.reg),
  });
  const [partForm, setPartForm] = useState({ part_no: "", part_description: "", supplier: "", s_code: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function updateDetail(index: number, patch: Partial<Detail>) {
    setDetails((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function saveIssue() {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await fetch(`/api/issues/${jobNo}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ details, delete_detail_ids: deleteIds }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not save issue");
      return;
    }
    setDeleteIds([]);
    setMessage("Issue saved.");
    router.refresh();
  }

  async function savePropertyDates() {
    if (!property?.sl_no) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/settings/property/${property.sl_no}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(propertyForm),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not save compliance dates");
      return;
    }
    setMessage("Compliance dates saved.");
    router.refresh();
  }

  async function addPart() {
    if (!partForm.part_description.trim()) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...partForm, job_no: jobNo }),
    });
    const data = (await res.json()) as { data?: Row; error?: string };
    setBusy(false);
    if (!res.ok || !data.data) {
      setError(data.error || "Could not add part");
      return;
    }
    setParts((current) => [...current, data.data!]);
    setPartForm({ part_no: "", part_description: "", supplier: "", s_code: "" });
  }

  async function removePart(id: number) {
    setBusy(true);
    const res = await fetch(`/api/parts?id=${id}`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not remove part");
      return;
    }
    setParts((current) => current.filter((row) => Number(row.part_id) !== id));
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{message}</div>
      ) : null}

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Job lines</div>
            <div className="text-xs text-slate-500">Update status, contractor, notes and close dates.</div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                setDetails((current) => [
                  ...current,
                  {
                    reported_issue: "",
                    priority: "ROT",
                    status: "Open",
                    c_id: null,
                    issue_quoted: 0,
                    client_ref: "",
                    update_issue: "",
                    n_code: "",
                    d_code: "",
                  },
                ])
              }
            >
              <Plus className="h-4 w-4" />
              Add line
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveIssue} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {details.map((detail, index) => {
            const deleted = deleteIds.includes(Number(detail.sl_no));
            if (deleted) return null;
            return (
              <div key={String(detail.sl_no ?? `new-${index}`)} className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    Line {index + 1}
                    <StatusBadge value={detail.status} />
                    <StatusBadge value={detail.priority} />
                  </div>
                  {detail.sl_no ? (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleteIds((current) => [...current, Number(detail.sl_no)])}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="md:col-span-2 xl:col-span-2">
                    <label className="label">Reported issue</label>
                    <textarea
                      className="textarea min-h-[74px]"
                      value={String(detail.reported_issue ?? "")}
                      onChange={(e) => updateDetail(index, { reported_issue: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select
                      className="select"
                      value={String(detail.status ?? "Open")}
                      onChange={(e) => {
                        const status = e.target.value;
                        updateDetail(index, {
                          status,
                          ...(status === "Close" && !detail.closing_date
                            ? { closing_date: new Date().toISOString().slice(0, 10) }
                            : {}),
                        });
                      }}
                    >
                      <option value="Open">Open</option>
                      <option value="Close">Close</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Priority</label>
                    <select
                      className="select"
                      value={String(detail.priority ?? "")}
                      onChange={(e) => updateDetail(index, { priority: e.target.value })}
                    >
                      <option value="">—</option>
                      <option value="EMG">Emergency</option>
                      <option value="URG">Urgent</option>
                      <option value="ROT">Routine</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Contractor</label>
                    <select
                      className="select"
                      value={String(detail.c_id ?? "")}
                      onChange={(e) => updateDetail(index, { c_id: e.target.value || null })}
                    >
                      <option value="">Unassigned</option>
                      {contractors.map((row) => (
                        <option key={String(row.c_id)} value={String(row.c_id)}>{String(row.contractor)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Second contractor</label>
                    <select
                      className="select"
                      value={String(detail.c_id_2 ?? "")}
                      onChange={(e) => updateDetail(index, { c_id_2: e.target.value || null })}
                    >
                      <option value="">—</option>
                      {contractors.map((row) => (
                        <option key={String(row.c_id)} value={String(row.c_id)}>{String(row.contractor)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Client ref</label>
                    <input
                      className="input"
                      value={String(detail.client_ref ?? "")}
                      onChange={(e) => updateDetail(index, { client_ref: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Closing date</label>
                    <input
                      type="date"
                      className="input"
                      value={dateInputValue(detail.closing_date)}
                      onChange={(e) => updateDetail(index, { closing_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Nominal</label>
                    <select
                      className="select"
                      value={String(detail.n_code ?? "")}
                      onChange={(e) => updateDetail(index, { n_code: e.target.value })}
                    >
                      <option value="">—</option>
                      {accounts.map((row) => (
                        <option key={String(row.n_code)} value={String(row.n_code)}>
                          {String(row.n_code)} · {String(row.nominal)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Department</label>
                    <select
                      className="select"
                      value={String(detail.d_code ?? "")}
                      onChange={(e) => updateDetail(index, { d_code: e.target.value })}
                    >
                      <option value="">—</option>
                      {departments.map((row) => (
                        <option key={String(row.d_code)} value={String(row.d_code)}>
                          {String(row.d_code)} · {String(row.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Quote required</label>
                    <select
                      className="select"
                      value={String(detail.issue_quoted ?? 0)}
                      onChange={(e) => updateDetail(index, { issue_quoted: Number(e.target.value) })}
                    >
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 xl:col-span-4">
                    <label className="label">Update / work log</label>
                    <textarea
                      className="textarea"
                      value={String(detail.update_issue ?? "")}
                      onChange={(e) => updateDetail(index, { update_issue: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2 xl:col-span-4">
                    <label className="label">Invoice note</label>
                    <textarea
                      className="textarea min-h-[64px]"
                      value={String(detail.invoice_note ?? "")}
                      onChange={(e) => updateDetail(index, { invoice_note: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {details.length === 0 ? <div className="empty-state">No job lines yet.</div> : null}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Compliance dates</div>
              <div className="text-xs text-slate-500">{property ? [property.p_no, property.p_name, property.p_location].filter(Boolean).join(", ") : "Property"}</div>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={savePropertyDates} disabled={busy}>
              <Save className="h-4 w-4" />
              Save dates
            </button>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {(["gas", "pir", "lra", "pat", "reg"] as const).map((key) => (
              <div key={key}>
                <label className="label">{key.toUpperCase()}</label>
                <input
                  type="date"
                  className="input"
                  value={propertyForm[key]}
                  onChange={(e) => setPropertyForm((current) => ({ ...current, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Client: <strong>{String(reporter?.reporter ?? "—")}</strong> · Tenant: <strong>{String(property?.tenant ?? "—")}</strong>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Parts</div>
              <div className="text-xs text-slate-500">Parts used on this job.</div>
            </div>
            <Wrench className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-3 p-5">
            {parts.map((part) => (
              <div key={String(part.part_id)} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{String(part.part_no || "Part")}</div>
                  <div className="truncate text-xs text-slate-500">{String(part.part_description || "")}</div>
                </div>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removePart(Number(part.part_id))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
              <input className="input" placeholder="Part no" value={partForm.part_no} onChange={(e) => setPartForm((c) => ({ ...c, part_no: e.target.value }))} />
              <input className="input" placeholder="Description" value={partForm.part_description} onChange={(e) => setPartForm((c) => ({ ...c, part_description: e.target.value }))} />
              <button type="button" className="btn btn-secondary" onClick={addPart} disabled={busy}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Appointments</div>
            <div className="text-xs text-slate-500">Scheduled visits for this job.</div>
          </div>
          <CalendarDays className="h-4 w-4 text-slate-400" />
        </div>
        <div className="table-wrap">
          <table className="data-table min-w-[600px]">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Contractor</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((slot) => (
                <tr key={String(slot.id)}>
                  <td>{String(slot.scheduler_date ?? "")}</td>
                  <td>{String(slot.sTime ?? "")} – {String(slot.eTime ?? "")}</td>
                  <td>{String(slot.c_id ?? "—")}</td>
                  <td><StatusBadge value={slot.status_contractor} /></td>
                  <td className="max-w-[300px] truncate">{String(slot.note ?? "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {schedules.length === 0 ? <div className="empty-state">No appointments booked.</div> : null}
      </div>
    </div>
  );
}
