import { FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { QuoteEditor } from "@/components/quote-editor";
import { getLookupData } from "@/lib/lookups";

export default async function CreateQuotePage() {
  const lookups = await getLookupData();
  return (
    <div>
      <PageHeader title="New Quote" description="Build a quote from labour, materials and certification lines." icon={FileText} />
      <QuoteEditor mode="create" initialQuote={null} initialLines={[]} properties={lookups.properties} />
    </div>
  );
}
