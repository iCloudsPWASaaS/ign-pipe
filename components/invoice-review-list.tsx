"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckSquare, Loader2, Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { shortDate } from "@/lib/format";

type Row = Record<string, unknown>;

export function InvoiceReviewList({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter();
  const [rows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ detail_id: number; invoice_no: string }[]>([]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      [row.reported_issue, row.p_name, row.p_no, row.invoice_no]
        .map((value) => String(value ?? "").toLowerCase())
        .some((value) => value.includes(needle)),
    );
  }, [rows, query]);

  function toggle(id: number) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  async function finalize() {
    if (!selected.length) return;
    if (!confirm(`Generate invoices for ${selected.length} job(s)?`)) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/invoices/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ detail_ids: selected }),
    });
    const data = (await res.json()) as { results?: { detail_id: number; invoice_no: string }[]; error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not finalize invoices");
      return;
    }
    setResult(data.results ?? []);
    setSelected([]);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {result.length ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="font-bold">Generated {result.length} invoice(s)</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {result.map((row) => (
              <span key={row.detail_id} className="rounded-full bg-white px-2 py-0.5 font-mono text-xs">
                {row.invoice_no}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>
      ) : null}

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search invoice queue..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={finalize} disabled={busy || selected.length === 0}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
            Generate invoices ({selected.length})
          </button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10" />
                <th>Closing date</th>
                <th>Job</th>
                <th>Property</th>
                <th>Reported issue</th>
                <th>Contractor</th>
                <th>Status</th>
                <th className="text-right">Edit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const id = Number(row.detail_id ?? row.sl_no);
                return (
                  <tr key={id}>
                    <td>
                      <input type="checkbox" checked={selected.includes(id)} onChange={() => toggle(id)} />
                    </td>
                    <td className="whitespace-nowrap">{shortDate(row.closing_date)}</td>
                    <td className="font-mono text-xs font-bold">#{String(row.job_no)}</td>
                    <td className="max-w-[260px]">
                      <div className="truncate font-semibold">{String(row.p_name ?? "—")}</div>
                      <div className="truncate text-[11px] text-slate-400">{String(row.p_no ?? "")} {String(row.p_location ?? "")}</div>
                    </td>
                    <td className="max-w-[320px] truncate">{String(row.reported_issue ?? "—")}</td>
                    <td>{String(row.contractor ?? "—")}</td>
                    <td><StatusBadge value={row.status} /></td>
                    <td className="text-right">
                      <Link href={`/invoices/job/${id}`} className="btn btn-secondary btn-sm">
                        Edit invoice
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? <div className="empty-state">No closed jobs waiting to be invoiced.</div> : null}
      </div>
    </div>
  );
}
