import { FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FreeInvoiceEditor } from "@/components/free-invoice-editor";
import { nextInvoiceNumber } from "@/lib/invoice";
import { getLookupData } from "@/lib/lookups";

export default async function CreateInvoicePage() {
  const [lookups, suggestedNo] = await Promise.all([getLookupData(), nextInvoiceNumber("PM")]);

  return (
    <div>
      <PageHeader
        title="Create Invoice"
        description="Raise a manual invoice without a closed job. Lines and totals mirror the legacy free-invoice flow."
        icon={FileText}
      />
      <FreeInvoiceEditor
        mode="create"
        suggestedNo={suggestedNo}
        initialInvoice={null}
        initialLines={[]}
        properties={lookups.properties}
        contractors={lookups.contractors}
        accounts={lookups.accounts}
        departments={lookups.departments}
      />
    </div>
  );
}
