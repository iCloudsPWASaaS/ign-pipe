import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getAdminClient } from "@/lib/supabase/admin";
import { money, shortDate } from "@/lib/format";

export default async function QuotesPage() {
  const { data, error } = await getAdminClient().from("quote_view").select("*").limit(500);

  return (
    <div>
      <PageHeader
        title="Quotes"
        description="Quotations raised against properties and reported issues."
        icon={FileText}
        actions={
          <Link href="/quotes/create" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            New quote
          </Link>
        }
      />
      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error.message}</div> : null}
      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Quote</th>
                <th>Date</th>
                <th>Property</th>
                <th>Info</th>
                <th>Net</th>
                <th>VAT</th>
                <th>Total</th>
                <th className="text-right">Open</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((row: Record<string, unknown>) => (
                <tr key={String(row.quote_no)}>
                  <td className="font-mono text-xs font-bold text-brand-700">Q{String(row.quote_no)}</td>
                  <td>{shortDate(row.quote_date)}</td>
                  <td className="max-w-[250px] truncate">{String(row.p_name ?? row.p_id ?? "—")}</td>
                  <td className="max-w-[320px] truncate">{String(row.quote_info ?? "")}</td>
                  <td>{money(row.cost)}</td>
                  <td>{money(row.vat)}</td>
                  <td className="font-bold">{money(row.total)}</td>
                  <td className="text-right">
                    <Link href={`/quotes/${row.quote_no}`} className="btn btn-secondary btn-sm">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(data ?? []).length === 0 ? <div className="empty-state">No quotes yet.</div> : null}
      </div>
    </div>
  );
}

