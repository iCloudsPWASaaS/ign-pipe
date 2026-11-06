"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, Plus, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { shortDate } from "@/lib/format";
import { PropertyPicker } from "@/components/property-picker";

type Job = Record<string, unknown>;
type Contractor = Record<string, unknown>;
type Slot = Record<string, unknown>;

export function AppointmentBoard({
  contractors,
  initialDate,
  initialSlots,
  prefill,
}: {
  contractors: Contractor[];
  initialDate: string;
  initialSlots: Slot[];
  prefill: { job_no?: string; p_id?: string; reported_issue_no?: string };
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [jobNo, setJobNo] = useState(prefill.job_no || "");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [pId, setPId] = useState(prefill.p_id || "");
  const [reported, setReported] = useState(prefill.reported_issue_no || "");
  const [contractorId, setContractorId] = useState("");
  const [slot, setSlot] = useState("am");
  const [note, setNote] = useState("");
  const [accessKeys, setAccessKeys] = useState("0");
  const [duration, setDuration] = useState("60");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/issues?status=open&limit=300")
      .then((res) => res.json())
      .then((data) => setJobs((data.data ?? []) as Job[]))
      .catch(() => setError("Could not load open jobs"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadSlots(date);
  }, [date]);

  useEffect(() => {
    if (!jobNo) return;
    fetch(`/api/issues/${jobNo}`)
      .then((res) => res.json())
      .then((data) => {
        setPId(String(data.issue?.p_id ?? ""));
        const ids = (data.details ?? []).map((row: Row) => row.sl_no).filter(Boolean);
        setReported(ids.join(","));
        if (data.details?.[0]?.c_id) setContractorId(String(data.details[0].c_id));
      })
      .catch(() => undefined);
  }, [jobNo]);

  async function loadSlots(value: string) {
    const res = await fetch(`/api/schedules?date=${encodeURIComponent(value)}`);
    const data = (await res.json()) as { data?: Slot[] };
    setSlots(data.data ?? []);
  }

  const visibleJobs = propertyFilter ? jobs.filter((job) => String(job.p_id) === propertyFilter) : jobs;
  const selectedJob = useMemo(() => jobs.find((job) => String(job.job_no) === jobNo), [jobs, jobNo]);

  async function book(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!jobNo || !contractorId || !date) {
      setError("Job, contractor and date are required.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_no: Number(jobNo),
        p_id: pId,
        c_id: Number(contractorId),
        scheduler_date: date,
        scheduler_time: slot,
        reported_issue_no: reported,
        note,
        access_keys: Number(accessKeys),
        duration: Number(duration),
        eventDetail: selectedJob ? String(selectedJob.p_name ?? "Appointment") : "Appointment",
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not book appointment");
      return;
    }
    setNote("");
    await loadSlots(date);
    router.refresh();
  }

  async function remove(id: number) {
    if (!confirm("Delete this appointment?")) return;
    setBusy(true);
    const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not delete appointment");
      return;
    }
    await loadSlots(date);
    router.refresh();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <form onSubmit={book} className="card h-fit">
        <div className="card-header">
          <div>
            <div className="card-title">Book appointment</div>
            <div className="text-xs text-slate-500">Create a visit against an open job.</div>
          </div>
          <CalendarDays className="h-4 w-4 text-slate-400" />
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="label">Property code filter</label>
            <PropertyPicker
              onSelect={(property) => {
                const id = property?.p_id || "";
                setPropertyFilter(id);
                const matches = id ? jobs.filter((job) => String(job.p_id) === id) : [];
                setJobNo(matches.length === 1 ? String(matches[0].job_no) : "");
              }}
            />
          </div>

          <div>
            <label className="label">Job</label>
            <select className="select" value={jobNo} onChange={(e) => setJobNo(e.target.value)} required>
              <option value="">Select open job...</option>
              {visibleJobs.map((job) => (
                <option key={String(job.job_no)} value={String(job.job_no)}>
                  #{String(job.job_no)} · {String(job.p_name ?? "")} {String(job.p_no ?? "")}
                </option>
              ))}
            </select>
            {loading ? <div className="mt-1 text-[11px] text-slate-400">Loading jobs...</div> : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label className="label">Slot</label>
              <select className="select" value={slot} onChange={(e) => setSlot(e.target.value)}>
                <option value="am">AM · 08:30–13:00</option>
                <option value="pm">PM · 12:00–17:30</option>
                <option value="ad">All day · 08:30–17:30</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Contractor</label>
            <select className="select" value={contractorId} onChange={(e) => setContractorId(e.target.value)} required>
              <option value="">Select contractor...</option>
              {contractors.map((row) => (
                <option key={String(row.c_id)} value={String(row.c_id)}>{String(row.contractor)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Duration (mins)</label>
              <input type="number" className="input" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div>
              <label className="label">Access keys</label>
              <select className="select" value={accessKeys} onChange={(e) => setAccessKeys(e.target.value)}>
                <option value="0">No</option>
                <option value="1">Yes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Note</label>
            <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="text-[11px] text-slate-500">
            Reported lines: <span className="font-mono">{reported || "—"}</span>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>
          ) : null}

          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {busy ? "Booking..." : "Book appointment"}
          </button>
        </div>
      </form>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Appointments · {shortDate(date)}</div>
            <div className="text-xs text-slate-500">{slots.length} booked</div>
          </div>
          <input type="date" className="input max-w-[170px]" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="divide-y divide-slate-100">
          {slots.map((row) => (
            <div key={String(row.id)} className="flex flex-wrap items-start gap-3 px-5 py-4">
              <div className="grid h-14 w-16 shrink-0 place-items-center rounded-xl bg-brand-50 text-center">
                <div className="text-xs font-black text-brand-800">{String(row.sTime ?? "").slice(0, 5)}</div>
                <div className="text-[10px] text-brand-600">{String(row.eTime ?? "").slice(0, 5)}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-bold text-slate-800">{String(row.contractor ?? "Unassigned")}</div>
                  <StatusBadge value={row.status_contractor} />
                  <span className="text-[11px] text-slate-400">Job #{String(row.job_no)}</span>
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {String(row.p_no ?? "")} {String(row.p_name ?? "")} {String(row.p_location ?? "")}
                </div>
                <div className="text-xs text-slate-500">{String(row.note ?? "")}</div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Lines: {String(row.reported_issue_no ?? "—")} · Keys: {Number(row.access_keys) === 1 ? "Yes" : "No"}
                </div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => remove(Number(row.id))} disabled={busy}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        {slots.length === 0 ? <div className="empty-state">No appointments for this date.</div> : null}
      </div>
    </div>
  );
}

type Row = Record<string, unknown>;
