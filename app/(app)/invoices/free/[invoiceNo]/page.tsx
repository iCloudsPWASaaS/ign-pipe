import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FreeInvoiceEditor } from "@/components/free-invoice-editor";
import { getLookupData } from "@/lib/lookups";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function FreeInvoicePage({
  params,
}: {
  params: Promise<{ invoiceNo: string }>;
}) {
  const { invoiceNo } = await params;
  const db = getAdminClient();
  const invoice = await db.from("invoicefree").select("*").eq("invoice_no", invoiceNo).maybeSingle();
  if (invoice.error || !invoice.data) notFound();

  const [lookups, lines] = await Promise.all([
    getLookupData(),
    db.from("invoice_detail").select("*").eq("reported_issue_no", invoiceNo).order("sl_no"),
  ]);

  return (
    <div>
      <PageHeader
        title={`Invoice ${invoiceNo}`}
        description="Manual invoice lines and header details."
        icon={FileText}
        actions={
          <Link href="/invoices/sale" className="btn btn-secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to sales
          </Link>
        }
      />
      <FreeInvoiceEditor
        mode="edit"
        invoiceNo={invoiceNo}
        suggestedNo={invoiceNo}
        initialInvoice={invoice.data}
        initialLines={lines.data ?? []}
        properties={lookups.properties}
        contractors={lookups.contractors}
        accounts={lookups.accounts}
        departments={lookups.departments}
      />
    </div>
  );
}
