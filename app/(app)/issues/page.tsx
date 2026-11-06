import Link from "next/link";
import { ClipboardList, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAdminClient } from "@/lib/supabase/admin";
import { displayAddress, shortDate } from "@/lib/format";

function dedupe(rows: Record<string, unknown>[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = String(row.job_no ?? "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const status = params.status || "all";
  const page = Math.max(Number(params.page || 1), 1);
  const pageSize = 25;

  const db = getAdminClient();
  let query = db.from("issue_full").select("*").order("job_no", { ascending: false }).limit(pageSize * 4);

  if (status === "open") query = query.not("status", "in", '("Close","Closed")');
  if (status === "closed") query = query.in("status", ["Close", "Closed"]);
  if (q) {
    query = query.or(
      [
        `reported_issue.ilike.%${q}%`,
        `p_name.ilike.%${q}%`,
        `p_no.ilike.%${q}%`,
        `p_location.ilike.%${q}%`,
        `client_ref.ilike.%${q}%`,
        `tenant.ilike.%${q}%`,
      ].join(","),
    );
  }

  const { data, error } = await query;
  const rows = dedupe(data ?? []);
  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <PageHeader
        title="Issues"
        description="Every job raised through the CRM, with live status and appointment detail."
        icon={ClipboardList}
        actions={
          <Link href="/issues/new" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Create Issue
          </Link>
        }
      />

      <form className="card mb-4 flex flex-wrap items-center gap-3 p-4" action="/issues">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={q}
            className="input pl-9"
            placeholder="Search issue, property, tenant or client ref..."
          />
        </div>
        <select name="status" defaultValue={status} className="select max-w-[180px]">
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <button className="btn btn-secondary" type="submit">
          Filter
        </button>
      </form>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error.message}
        </div>
      ) : null}

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Date</th>
                <th>Property</th>
                <th>Client</th>
                <th>Reported issue</th>
                <th>Contractor</th>
                <th>Priority</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={String(row.detail_id ?? row.job_no)}>
                  <td className="font-mono text-xs font-bold text-brand-700">#{String(row.job_no)}</td>
                  <td className="whitespace-nowrap">{shortDate(row.maintenance_date)}</td>
                  <td className="max-w-[280px]">
                    <div className="truncate font-semibold">{String(row.p_name ?? "—")}</div>
                    <div className="truncate text-[11px] text-slate-400">{displayAddress(row)}</div>
                  </td>
                  <td className="max-w-[180px] truncate">{String(row.tenant ?? row.landlord ?? "—")}</td>
                  <td className="max-w-[320px] truncate">{String(row.reported_issue ?? "—")}</td>
                  <td className="whitespace-nowrap">{String(row.contractor ?? "—")}</td>
                  <td><StatusBadge value={row.priority} /></td>
                  <td><StatusBadge value={row.status} /></td>
                  <td>
                    <Link href={`/issues/${row.job_no}`} className="btn btn-secondary btn-sm">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pageRows.length === 0 ? <div className="empty-state">No issues match this filter.</div> : null}
        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm">
            <div className="text-slate-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Link
                href={{ pathname: "/issues", query: { q, status, page: Math.max(page - 1, 1) } }}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </Link>
              <Link
                href={{ pathname: "/issues", query: { q, status, page: Math.min(page + 1, totalPages) } }}
                className="btn btn-secondary btn-sm"
              >
                Next
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
