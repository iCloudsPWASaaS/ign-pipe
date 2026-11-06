import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, Download, FileText, Mail, Receipt, Wrench } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAdminClient } from "@/lib/supabase/admin";
import { displayAddress, money, shortDate } from "@/lib/format";

const allowed = new Set(["issues", "timesheets", "export", "closed-jobs", "contractor-snapshot", "sms-scheduler"]);

const meta: Record<string, { title: string; description: string }> = {
  issues: { title: "Issues Log", description: "All issues, timesheets and operational records." },
  timesheets: { title: "Time Sheet", description: "Contractor time entries and job costs." },
  export: { title: "Export Files", description: "Download CRM data as CSV." },
  "closed-jobs": { title: "Closed Jobs To Be Invoiced", description: "Closed jobs waiting for invoice generation." },
  "contractor-snapshot": { title: "Contractor Daily Snapshot", description: "Today's visits and work detail by contractor." },
  "sms-scheduler": { title: "SMS Scheduler", description: "Scheduled clients with mobile numbers for SMS reminders." },
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ report: string }>;
}) {
  const { report } = await params;
  if (!allowed.has(report)) notFound();
  const info = meta[report];
  const db = getAdminClient();

  let content: React.ReactNode = null;

  if (report === "export") {
    content = (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { type: "issues", label: "Issues", icon: BarChart3 },
          { type: "timesheets", label: "Timesheets", icon: FileText },
          { type: "purchases", label: "Purchases", icon: Receipt },
          { type: "invoices", label: "Invoices", icon: Receipt },
          { type: "properties", label: "Properties", icon: Wrench },
          { type: "clients", label: "Clients", icon: Mail },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.type}
              href={`/api/export?type=${item.type}`}
              className="card flex items-center gap-3 p-5 transition hover:border-brand-200 hover:bg-brand-50"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-700">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-pipe-ink">Export {item.label}</div>
                <div className="text-xs text-slate-500">CSV download</div>
              </div>
              <Download className="ml-auto h-4 w-4 text-slate-400" />
            </a>
          );
        })}
      </div>
    );
  }

  if (report === "issues") {
    const { data } = await db.from("issue_full").select("*").order("job_no", { ascending: false }).limit(1000);
    content = (
      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Date</th>
                <th>Property</th>
                <th>Reported issue</th>
                <th>Contractor</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Closed</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((row: Record<string, unknown>) => (
                <tr key={`${row.detail_id ?? row.job_no}`}>
                  <td className="font-mono text-xs font-bold">
                    <Link href={`/issues/${row.job_no}`} className="hover:underline">#{String(row.job_no)}</Link>
                  </td>
                  <td>{shortDate(row.maintenance_date)}</td>
                  <td className="max-w-[260px] truncate">{String(row.p_name ?? displayAddress(row))}</td>
                  <td className="max-w-[340px] truncate">{String(row.reported_issue ?? "—")}</td>
                  <td>{String(row.contractor ?? "—")}</td>
                  <td><StatusBadge value={row.priority} /></td>
                  <td><StatusBadge value={row.status} /></td>
                  <td>{shortDate(row.closing_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(data ?? []).length === 0 ? <div className="empty-state">No issue records.</div> : null}
      </div>
    );
  }

  if (report === "timesheets") {
    const { data } = await db.from("timesheet_view").select("*").order("date", { ascending: false }).limit(1000);
    content = (
      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Contractor</th>
                <th>Property</th>
                <th>Start</th>
                <th>End</th>
                <th>Minutes</th>
                <th>Labour</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((row: Record<string, unknown>) => (
                <tr key={String(row.sl_no)}>
                  <td>{shortDate(row.date)}</td>
                  <td>{String(row.contractor ?? "—")}</td>
                  <td className="max-w-[240px] truncate">{String(row.p_name ?? row.p_id ?? "—")}</td>
                  <td>{String(row.start_time ?? "")}</td>
                  <td>{String(row.end_time ?? "")}</td>
                  <td>{String(row.total_minutes ?? "")}</td>
                  <td>{money(row.labour)}</td>
                  <td className="max-w-[280px] truncate">{String(row.description ?? "")}</td>
                  <td><StatusBadge value={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(data ?? []).length === 0 ? <div className="empty-state">No timesheet records.</div> : null}
      </div>
    );
  }

  if (report === "closed-jobs") {
    const { data } = await db.from("invoice_review_view").select("*").order("closing_date").limit(1000);
    content = (
      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Closing date</th>
                <th>Job</th>
                <th>Property</th>
                <th>Reported issue</th>
                <th>Contractor</th>
                <th>Status</th>
                <th className="text-right">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((row: Record<string, unknown>) => (
                <tr key={String(row.detail_id)}>
                  <td>{shortDate(row.closing_date)}</td>
                  <td className="font-mono text-xs">#{String(row.job_no)}</td>
                  <td className="max-w-[260px] truncate">{String(row.p_name ?? "—")}</td>
                  <td className="max-w-[320px] truncate">{String(row.reported_issue ?? "—")}</td>
                  <td>{String(row.contractor ?? "—")}</td>
                  <td><StatusBadge value={row.status} /></td>
                  <td className="text-right">
                    <Link href={`/invoices/job/${row.detail_id}`} className="btn btn-secondary btn-sm">Invoice</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(data ?? []).length === 0 ? <div className="empty-state">No closed jobs waiting to be invoiced.</div> : null}
      </div>
    );
  }

  if (report === "contractor-snapshot") {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await db.from("scheduler_view").select("*").eq("scheduler_date", today).order("c_id").order("sTime");
    content = (
      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contractor</th>
                <th>Time</th>
                <th>Job</th>
                <th>Property</th>
                <th>Address</th>
                <th>Keys</th>
                <th>Note</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((row: Record<string, unknown>) => (
                <tr key={String(row.id)}>
                  <td className="font-semibold">{String(row.contractor ?? "—")}</td>
                  <td>{String(row.sTime ?? "")}–{String(row.eTime ?? "")}</td>
                  <td className="font-mono text-xs">#{String(row.job_no)}</td>
                  <td>{String(row.p_name ?? "—")}</td>
                  <td className="max-w-[280px] truncate">{displayAddress(row)}</td>
                  <td>{Number(row.access_keys) === 1 ? "Yes" : "No"}</td>
                  <td className="max-w-[240px] truncate">{String(row.note ?? "")}</td>
                  <td><StatusBadge value={row.status_contractor} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(data ?? []).length === 0 ? <div className="empty-state">No contractor appointments today.</div> : null}
      </div>
    );
  }

  if (report === "sms-scheduler") {
    const { data } = await db.from("scheduler_view").select("*").gte("scheduler_date", new Date().toISOString().slice(0, 10)).order("scheduler_date").limit(500);
    const { data: reporters } = await db.from("reporter").select("r_id,reporter,phone,email").limit(2000);
    const map = new Map<number, Record<string, unknown>>((reporters ?? []).map((row: Record<string, unknown>) => [Number(row.r_id), row] as [number, Record<string, unknown>]));
    content = (
      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Client</th>
                <th>Phone</th>
                <th>Property</th>
                <th>Contractor</th>
                <th className="text-right">SMS</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((row: Record<string, unknown>) => {
                const reporter = map.get(Number(row.r_id));
                return (
                  <tr key={String(row.id)}>
                    <td>{shortDate(row.scheduler_date)}</td>
                    <td>{String(row.sTime ?? "")}</td>
                    <td>{String(reporter?.reporter ?? "—")}</td>
                    <td className="font-mono text-xs">{String(reporter?.phone ?? "—")}</td>
                    <td className="max-w-[260px] truncate">{String(row.p_name ?? "—")}</td>
                    <td>{String(row.contractor ?? "—")}</td>
                    <td className="text-right">
                      {reporter?.phone ? (
                        <a className="btn btn-secondary btn-sm" href={`sms:${String(reporter.phone)}`}>Text</a>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(data ?? []).length === 0 ? <div className="empty-state">No scheduled clients.</div> : null}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={info.title} description={info.description} icon={BarChart3} />
      {content}
    </div>
  );
}



