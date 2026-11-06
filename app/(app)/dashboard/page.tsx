import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  Clock3,
  FileText,
  Plus,
  Receipt,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { getAdminClient } from "@/lib/supabase/admin";
import { getAppSettings } from "@/lib/app-settings";
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

export default async function DashboardPage() {
  const db = getAdminClient();
  const settings = await getAppSettings();
  const today = new Date().toISOString().slice(0, 10);

  const [open, closed, review, appointments, issuesResult, scheduleResult, errorCheck] =
    await Promise.all([
      db.from("issue_full").select("*", { count: "exact", head: true }).not("status", "in", '("Close","Closed")'),
      db.from("issue_full").select("*", { count: "exact", head: true }).in("status", ["Close", "Closed"]),
      db.from("invoice_review_view").select("*", { count: "exact", head: true }),
      db.from("scheduler_view").select("*", { count: "exact", head: true }).eq("scheduler_date", today),
      db.from("issue_full").select("*").order("job_no", { ascending: false }).limit(80),
      db.from("scheduler_view").select("*").gte("scheduler_date", today).order("scheduler_date").limit(10),
      db.from("issue_full").select("*").limit(1),
    ]);

  if (errorCheck.error) {
    return (
      <div>
        <PageHeader title="Dashboard" description={`${settings.appName} operations overview.`} />
        <div className="card p-6">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <div className="font-bold text-pipe-ink">The pipe schema is not ready yet</div>
              <p className="mt-1 text-sm text-slate-600">
                Run <span className="font-mono">supabase/pipe_schema.sql</span> in the Supabase SQL
                editor, add <span className="font-mono">pipe</span> to the exposed schemas, then reload.
              </p>
              <p className="mt-2 text-xs text-red-600">{errorCheck.error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const recent = dedupe(issuesResult.data ?? []).slice(0, 8);
  const upcoming = scheduleResult.data ?? [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live operational picture across issues, appointments and invoices."
        icon={ClipboardList}
        actions={
          <>
            <Link href="/issues/new" className="btn btn-primary">
              <Plus className="h-4 w-4" />
              Create Issue
            </Link>
            <Link href="/appointments" className="btn btn-secondary">
              <CalendarDays className="h-4 w-4" />
              Appointment
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open issues" value={open.count ?? 0} hint="Not yet closed" icon={ClipboardList} tone="amber" />
        <StatCard label="Closed jobs" value={closed.count ?? 0} hint="All time" icon={Wrench} tone="emerald" />
        <StatCard label="Appointments today" value={appointments.count ?? 0} hint={shortDate(today)} icon={CalendarDays} tone="brand" />
        <StatCard label="Invoices to review" value={review.count ?? 0} hint="Closed jobs awaiting invoice" icon={Receipt} tone="rose" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent issues</div>
              <div className="text-xs text-slate-500">Latest jobs created</div>
            </div>
            <Link href="/issues" className="btn btn-secondary btn-sm">
              View all
            </Link>
          </div>
          <div className="table-wrap">
            <table className="data-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Property</th>
                  <th>Reported issue</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((issue) => (
                  <tr key={String(issue.job_no)}>
                    <td>
                      <Link href={`/issues/${issue.job_no}`} className="font-bold text-brand-700 hover:underline">
                        #{String(issue.job_no)}
                      </Link>
                      <div className="text-[11px] text-slate-400">{shortDate(issue.maintenance_date)}</div>
                    </td>
                    <td className="max-w-[260px]">
                      <div className="truncate font-semibold text-slate-700">{String(issue.p_name ?? "—")}</div>
                      <div className="truncate text-[11px] text-slate-400">{displayAddress(issue)}</div>
                    </td>
                    <td className="max-w-[300px] truncate">{String(issue.reported_issue ?? "—")}</td>
                    <td><StatusBadge value={issue.priority} /></td>
                    <td><StatusBadge value={issue.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recent.length === 0 ? <div className="empty-state">No issues yet. Create the first one.</div> : null}
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Upcoming appointments</div>
                <div className="text-xs text-slate-500">Next scheduled visits</div>
              </div>
              <CalendarDays className="h-4 w-4 text-slate-400" />
            </div>
            <div className="divide-y divide-slate-100">
              {upcoming.map((slot: Record<string, unknown>) => (
                <div key={String(slot.id)} className="flex items-start gap-3 px-5 py-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-[11px] font-black text-brand-700">
                    {String(slot.sTime ?? "").slice(0, 5)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-700">
                      {String(slot.contractor ?? "Unassigned")}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {shortDate(slot.scheduler_date)} Â· {String(slot.p_name ?? slot.p_id ?? "")}
                    </div>
                    <div className="truncate text-[11px] text-slate-400">{String(slot.reported_issue_no ?? "")}</div>
                  </div>
                </div>
              ))}
              {upcoming.length === 0 ? <div className="empty-state">No upcoming appointments.</div> : null}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Quick links</div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4">
              <Link href="/invoices/review" className="rounded-xl border border-slate-200 p-3 text-sm font-semibold hover:border-brand-200 hover:bg-brand-50">
                <Receipt className="mb-2 h-4 w-4 text-brand-600" />
                Invoices
              </Link>
              <Link href="/timesheets" className="rounded-xl border border-slate-200 p-3 text-sm font-semibold hover:border-brand-200 hover:bg-brand-50">
                <Clock3 className="mb-2 h-4 w-4 text-brand-600" />
                Timesheets
              </Link>
              <Link href="/purchase" className="rounded-xl border border-slate-200 p-3 text-sm font-semibold hover:border-brand-200 hover:bg-brand-50">
                <FileText className="mb-2 h-4 w-4 text-brand-600" />
                Purchases
              </Link>
              <Link href="/settings/property" className="rounded-xl border border-slate-200 p-3 text-sm font-semibold hover:border-brand-200 hover:bg-brand-50">
                <Wrench className="mb-2 h-4 w-4 text-brand-600" />
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

