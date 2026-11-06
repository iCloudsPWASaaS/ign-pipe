import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { IssueEditor } from "@/components/issue-editor";
import { StatusBadge } from "@/components/status-badge";
import { getAdminClient } from "@/lib/supabase/admin";
import { displayAddress, shortDate } from "@/lib/format";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ jobNo: string }>;
}) {
  const { jobNo } = await params;
  const job = Number(jobNo);
  if (!Number.isFinite(job)) notFound();

  const db = getAdminClient();
  const issueResult = await db.from("control_sheet").select("*").eq("job_no", job).maybeSingle();
  if (issueResult.error || !issueResult.data) notFound();
  const issue = issueResult.data;

  const [details, propertyResult, contractors, accounts, departments, parts, schedules] =
    await Promise.all([
      db.from("control_sheet_approved").select("*").eq("job_no", job).order("sl_no"),
      db.from("property").select("*").eq("p_id", issue.p_id).maybeSingle(),
      db.from("contractor").select("c_id,contractor,tradesman").eq("active", 1).order("contractor"),
      db.from("account").select("sl_no,nominal,n_code").eq("active", 1).order("nominal"),
      db.from("department").select("sl_no,name,d_code").order("name"),
      db.from("part_details").select("*").eq("job_no", job).order("part_id"),
      db.from("schedule").select("*").eq("job_no", job).order("scheduler_date"),
    ]);

  let reporter = null;
  if (propertyResult.data?.r_id) {
    const result = await db.from("reporter").select("*").eq("r_id", propertyResult.data.r_id).maybeSingle();
    reporter = result.data;
  }

  const rows = details.data ?? [];
  const status = rows[0]?.status;

  return (
    <div>
      <PageHeader
        title={`Issue #${job}`}
        description={
          propertyResult.data
            ? `${displayAddress(propertyResult.data)} Â· raised ${shortDate(issue.maintenance_date)}`
            : `Raised ${shortDate(issue.maintenance_date)}`
        }
        icon={ClipboardList}
        actions={
          <>
            <Link href="/issues" className="btn btn-secondary">
              <ArrowLeft className="h-4 w-4" />
              All issues
            </Link>
            <Link
              href={{
                pathname: "/appointments",
                query: { job_no: job, p_id: issue.p_id, reported_issue_no: rows.map((row: Record<string, unknown>) => row.sl_no).join(",") },
              }}
              className="btn btn-primary"
            >
              <CalendarPlus className="h-4 w-4" />
              Book appointment
            </Link>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StatusBadge value={status} />
        <StatusBadge value={rows[0]?.priority} />
        <span className="text-xs text-slate-500">
          {propertyResult.data ? displayAddress(propertyResult.data) : ""}
        </span>
        {reporter ? (
          <span className="text-xs text-slate-500">Â· {String(reporter.reporter ?? "")}</span>
        ) : null}
      </div>

      <IssueEditor
        jobNo={job}
        initialDetails={rows}
        property={propertyResult.data ?? null}
        reporter={reporter}
        contractors={contractors.data ?? []}
        accounts={accounts.data ?? []}
        departments={departments.data ?? []}
        initialParts={parts.data ?? []}
        schedules={schedules.data ?? []}
      />
    </div>
  );
}

