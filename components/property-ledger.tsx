"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Loader2, Receipt, Search } from "lucide-react";
import { PropertyPicker, type PropertyOption } from "@/components/property-picker";
import { StatusBadge } from "@/components/status-badge";
import { displayAddress, money, shortDate } from "@/lib/format";

type Row = Record<string, unknown>;

type History = {
  property: Row;
  reporter: Row | null;
  issues: Row[];
  appointments: Row[];
  purchases: Row[];
  cashfloat: Row[];
  quotes: Row[];
  timesheets: Row[];
  invoices: Row[];
};

export function PropertyLedger({ initialCode }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode || "");
  const [property, setProperty] = useState<Row | null>(null);
  const [data, setData] = useState<History | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialCode) void loadByCode(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  async function loadByCode(value: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/properties/history?code=${encodeURIComponent(value.trim())}`);
      const json = (await res.json()) as History & { error?: string };
      if (!res.ok) throw new Error(json.error || "Property not found");
      setData(json);
      setProperty(json.property);
      setCode(String(json.property.p_code || json.property.p_no || json.property.p_id || value));
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Property not found");
    } finally {
      setLoading(false);
    }
  }

  async function loadByProperty(option: PropertyOption) {
    setProperty(option as unknown as Row);
    setCode(String(option.p_code || option.p_no || option.p_id));
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/properties/history?p_id=${encodeURIComponent(option.p_id)}`);
      const json = (await res.json()) as History & { error?: string };
      if (!res.ok) throw new Error(json.error || "Property not found");
      setData(json);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Property not found");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-[280px] flex-1">
            <label className="label">Property code</label>
            <PropertyPicker
              initialProperty={property as unknown as PropertyOption}
              onSelect={(option) => {
                if (option) void loadByProperty(option);
                else {
                  setData(null);
                  setProperty(null);
                }
              }}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary mt-[22px] shrink-0"
            onClick={() => loadByCode(code)}
            disabled={!code || loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search property
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Type a property code, number, ID or name and press Enter. Related issues, appointments,
          invoices, purchases and float entries will load below.
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {!data && !loading && !error ? (
        <div className="card empty-state">
          <Building2 className="h-6 w-6 text-slate-400" />
          Search for a property to see its full history.
        </div>
      ) : null}

      {data ? (
        <>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  {[data.property.p_no, data.property.p_name].filter(Boolean).join(" · ")}
                </div>
                <div className="text-xs text-slate-500">
                  {displayAddress(data.property)} · Code {String(data.property.p_code ?? "—")}
                </div>
              </div>
              <span className="badge bg-brand-100 text-brand-800">{String(data.property.p_code ?? "")}</span>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Client" value={data.reporter?.reporter ?? data.property.landlord} />
              <Info label="Tenant" value={data.property.tenant} />
              <Info label="Phone" value={data.property.tenant_phone || data.reporter?.phone} />
              <Info label="Email" value={data.property.tenant_email || data.reporter?.email} />
              <Info label="Key no" value={data.property.key_no} />
              <Info label="Gas" value={shortDate(data.property.gas)} />
              <Info label="LRA" value={shortDate(data.property.lra)} />
              <Info label="PAT" value={shortDate(data.property.pat)} />
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <SmallTable
              title="Issues"
              count={data.issues.length}
              headers={["Job", "Date", "Issue", "Status"]}
              rows={data.issues.map((row) => [
                <Link key="job" href={`/issues/${row.job_no}`} className="font-bold text-brand-700 hover:underline">
                  #{String(row.job_no)}
                </Link>,
                shortDate(row.maintenance_date),
                String(row.reported_issue ?? "—"),
                <StatusBadge key="status" value={row.status} />,
              ])}
            />
            <SmallTable
              title="Appointments"
              count={data.appointments.length}
              headers={["Date", "Time", "Contractor", "Status"]}
              rows={data.appointments.map((row) => [
                shortDate(row.scheduler_date),
                `${String(row.sTime ?? "")}–${String(row.eTime ?? "")}`,
                String(row.contractor ?? "—"),
                <StatusBadge key="status" value={row.status_contractor} />,
              ])}
            />
            <SmallTable
              title="Invoices"
              count={data.invoices.length}
              headers={["Invoice", "Date", "Total", "Type"]}
              rows={data.invoices.map((row) => [
                row.kind === "job" ? (
                  <Link key="inv" href={`/invoices/job/${row.detail_id}`} className="font-mono text-xs font-bold text-brand-700 hover:underline">
                    {String(row.invoice_no)}
                  </Link>
                ) : (
                  <Link key="inv" href={`/invoices/free/${row.invoice_no}`} className="font-mono text-xs font-bold text-brand-700 hover:underline">
                    {String(row.invoice_no)}
                  </Link>
                ),
                shortDate(row.date),
                money(row.total),
                <span key="type" className="badge bg-slate-100 text-slate-700">{row.kind === "job" ? "Job" : "Manual"}</span>,
              ])}
            />
            <SmallTable
              title="Purchases"
              count={data.purchases.length}
              headers={["Invoice", "Date", "Supplier", "Total"]}
              rows={data.purchases.map((row) => [
                String(row.inv_no ?? "—"),
                shortDate(row.inv_date),
                String(row.s_code ?? "—"),
                money(row.total),
              ])}
            />
            <SmallTable
              title="Float / cash"
              count={data.cashfloat.length}
              headers={["Date", "Description", "Total"]}
              rows={data.cashfloat.map((row) => [
                shortDate(row.inv_date),
                String(row.description ?? "—"),
                money(row.total),
              ])}
            />
            <SmallTable
              title="Quotes"
              count={data.quotes.length}
              headers={["Quote", "Date", "Total"]}
              rows={data.quotes.map((row) => [
                <Link key="quote" href={`/quotes/${row.quote_no}`} className="font-mono text-xs font-bold text-brand-700 hover:underline">
                  Q{String(row.quote_no)}
                </Link>,
                shortDate(row.quote_date),
                money(row.total),
              ])}
            />
            <SmallTable
              title="Timesheets"
              count={data.timesheets.length}
              headers={["Date", "Contractor", "Description", "Status"]}
              rows={data.timesheets.map((row) => [
                shortDate(row.date),
                String(row.contractor ?? "—"),
                String(row.description ?? "—"),
                <StatusBadge key="status" value={row.status} />,
              ])}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 truncate text-sm font-semibold text-slate-700">
        {value === null || value === undefined || value === "" ? "—" : String(value)}
      </div>
    </div>
  );
}

function SmallTable({
  title,
  count,
  headers,
  rows,
}: {
  title: string;
  count: number;
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="card">
      <div className="card-header py-3">
        <div className="card-title flex items-center gap-2 text-sm">
          <Receipt className="h-4 w-4 text-slate-400" />
          {title}
        </div>
        <span className="badge bg-slate-100 text-slate-600">{count}</span>
      </div>
      <div className="table-wrap max-h-[340px] overflow-y-auto">
        <table className="data-table min-w-[520px]">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="max-w-[240px] truncate">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {count === 0 ? <div className="px-4 py-6 text-center text-xs text-slate-400">No records.</div> : null}
    </div>
  );
}
