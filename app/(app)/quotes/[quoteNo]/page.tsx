import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { QuoteEditor } from "@/components/quote-editor";
import { getLookupData } from "@/lib/lookups";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ quoteNo: string }>;
}) {
  const { quoteNo } = await params;
  const db = getAdminClient();
  const quote = await db.from("quote").select("*").eq("quote_no", Number(quoteNo)).maybeSingle();
  if (quote.error || !quote.data) notFound();
  const [lookups, lines] = await Promise.all([
    getLookupData(),
    db.from("quote_detail").select("*").eq("quote_no", Number(quoteNo)).order("sl_no"),
  ]);

  return (
    <div>
      <PageHeader title={`Quote Q${quoteNo}`} description="Edit quote details and lines." icon={FileText} />
      <QuoteEditor
        mode="edit"
        quoteNo={Number(quoteNo)}
        initialQuote={quote.data}
        initialLines={lines.data ?? []}
        properties={lookups.properties}
      />
    </div>
  );
}
