import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { JobInvoiceEditor } from "@/components/job-invoice-editor";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function JobInvoicePage({
  params,
}: {
  params: Promise<{ detailId: string }>;
}) {
  const { detailId } = await params;
  const db = getAdminClient();
  const detail = await db.from("control_sheet_approved").select("*").eq("sl_no", Number(detailId)).maybeSingle();
  if (detail.error || !detail.data) notFound();

  const issue = await db.from("control_sheet").select("*").eq("job_no", detail.data.job_no).maybeSingle();
  const property = issue.data?.p_id
    ? await db.from("property").select("*").eq("p_id", issue.data.p_id).maybeSingle()
    : null;
  const reporter = property?.data?.r_id
    ? await db.from("reporter").select("*").eq("r_id", property.data.r_id).maybeSingle()
    : null;
  const [lines, accounts, departments] = await Promise.all([
    db.from("invoice_detail").select("*").eq("reported_issue_no", String(detailId)).order("sl_no"),
    db.from("account").select("n_code,nominal").eq("active", 1).order("nominal"),
    db.from("department").select("d_code,name").order("name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Job Invoice"
        description={`Job #${detail.data.job_no} · ${property?.data?.p_name ?? ""}`}
        icon={Receipt}
        actions={
          <Link href="/invoices/review" className="btn btn-secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to review
          </Link>
        }
      />
      <JobInvoiceEditor
        detail={detail.data}
        issue={issue.data ?? {}}
        property={property?.data ?? null}
        reporter={reporter?.data ?? null}
        initialLines={lines.data ?? []}
        accounts={accounts.data ?? []}
        departments={departments.data ?? []}
      />
    </div>
  );
}
