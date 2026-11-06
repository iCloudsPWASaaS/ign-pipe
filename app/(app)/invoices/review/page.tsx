import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { InvoiceReviewList } from "@/components/invoice-review-list";
import { getAdminClient } from "@/lib/supabase/admin";

function dedupe(rows: Record<string, unknown>[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = String(row.detail_id ?? row.job_no ?? "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function ReviewInvoicesPage() {
  const { data, error } = await getAdminClient()
    .from("invoice_review_view")
    .select("*")
    .order("closing_date", { ascending: true })
    .limit(1000);

  return (
    <div>
      <PageHeader
        title="Invoices For Review"
        description="Closed jobs with invoice lines ready to be reviewed and numbered."
        icon={Receipt}
      />
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error.message}</div>
      ) : null}
      <InvoiceReviewList initialRows={dedupe(data ?? [])} />
    </div>
  );
}
