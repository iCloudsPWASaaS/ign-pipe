import Link from "next/link";
import { FileText, Plus, Receipt } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAdminClient } from "@/lib/supabase/admin";
import { invoiceTotals } from "@/lib/invoice-totals";
import { money, shortDate } from "@/lib/format";

type Line = { reported_issue_no: string; quantity: number; unit_price: number };

export default async function SaleInvoicesPage() {
  const db = getAdminClient();
  const [saleResult, freeResult, lineResult] = await Promise.all([
    db.from("sale_invoice_view").select("*").order("closing_date", { ascending: false }).limit(500),
    db.from("invoicefree").select("*").order("invoice_date", { ascending: false }).limit(500),
    db.from("invoice_detail").select("reported_issue_no,quantity,unit_price").limit(10000),
  ]);

  const totals = new Map<string, { net: number; vat: number; total: number }>();
  for (const line of (lineResult.data ?? []) as Line[]) {
    const key = String(line.reported_issue_no);
    const current = totals.get(key) ?? { net: 0, vat: 0, total: 0 };
    const value = Number(line.quantity || 0) * Number(line.unit_price || 0);
    current.net += value;
    current.vat += value * 0.2;
    current.total += value * 1.2;
    totals.set(key, current);
  }

  const saleRows = (saleResult.data ?? [])
    .filter((row: Record<string, unknown>, index: number, array: Record<string, unknown>[]) => array.findIndex((x: Record<string, unknown>) => x.detail_id === row.detail_id) === index)
    .map((row: Record<string, unknown>) => ({
      ...row,
      invoice_no: String(row.invoice_no ?? ""),
      totals: totals.get(String(row.detail_id)) ?? { net: 0, vat: 0, total: 0 },
      kind: "job" as const,
    }));

  const freeRows = (freeResult.data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    detail_id: null,
    job_no: null,
    p_name: null,
    p_no: null,
    p_location: null,
    contractor: null,
    closing_date: row.invoice_date,
    totals: totals.get(String(row.invoice_no)) ?? { net: 0, vat: 0, total: 0 },
    kind: "free" as const,
  }));

  const rows = [...saleRows, ...freeRows];

  return (
    <div>
      <PageHeader
        title="Sale Invoices"
        description="Numbered invoices generated from closed jobs and manual invoices."
        icon={Receipt}
        actions={
          <Link href="/invoices/create" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Create Invoice
          </Link>
        }
      />

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice no</th>
                <th>Date</th>
                <th>Property</th>
                <th>Notice</th>
                <th>Net</th>
                <th>VAT</th>
                <th>Total</th>
                <th>Status</th>
                <th className="text-right">Open</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.kind}-${row.invoice_no}`}>
                  <td className="font-mono text-xs font-bold text-brand-700">{String(row.invoice_no || "—")}</td>
                  <td className="whitespace-nowrap">{shortDate(row.closing_date)}</td>
                  <td className="max-w-[240px] truncate">{String(row.p_name ?? row.p_id ?? "—")}</td>
                  <td className="max-w-[280px] truncate">
                    {String(row.invoice_note ?? row.reported_issue ?? "")}
                  </td>
                  <td>{money(row.totals.net)}</td>
                  <td>{money(row.totals.vat)}</td>
                  <td className="font-bold">{money(row.totals.total)}</td>
                  <td><StatusBadge value={row.status ?? "Close"} /></td>
                  <td className="text-right">
                    <Link
                      href={row.kind === "job" ? `/invoices/job/${row.detail_id}` : `/invoices/free/${row.invoice_no}`}
                      className="btn btn-secondary btn-sm"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? <div className="empty-state">No sale invoices yet.</div> : null}
      </div>
    </div>
  );
}


