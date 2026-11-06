"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { invoiceTotals } from "@/lib/invoice-totals";
import { dateInputValue, displayAddress, money } from "@/lib/format";

type Line = { description: string; description_type: string; quantity: string; unit_price: string };
type Row = Record<string, unknown>;

const lineTypes = ["Labour", "Material", "Certification"];

export function JobInvoiceEditor({
  detail,
  issue,
  property,
  reporter,
  initialLines,
  accounts,
  departments,
}: {
  detail: Row;
  issue: Row;
  property: Row | null;
  reporter: Row | null;
  initialLines: Row[];
  accounts: Row[];
  departments: Row[];
}) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>(
    initialLines.length
      ? initialLines.map((line) => ({
          description: String(line.description ?? ""),
          description_type: String(line.description_type ?? "Labour"),
          quantity: String(line.quantity ?? "1"),
          unit_price: String(line.unit_price ?? "0"),
        }))
      : [{ description: "", description_type: "Labour", quantity: "1", unit_price: "0" }],
  );
  const [nCode, setNCode] = useState(String(detail.n_code ?? ""));
  const [dCode, setDCode] = useState(String(detail.d_code ?? ""));
  const [note, setNote] = useState(String(detail.invoice_note ?? ""));
  const [discount, setDiscount] = useState(String(detail.discount_amount ?? "0"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const totals = invoiceTotals(
    lines.map((line) => ({ quantity: Number(line.quantity || 0), unit_price: Number(line.unit_price || 0) })),
    Number(discount || 0),
  );

  function update(index: number, patch: Partial<Line>) {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await fetch(`/api/invoices/job/${detail.sl_no}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ n_code: nCode, d_code: dCode, invoice_note: note, discount_amount: Number(discount || 0), details: lines }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not save invoice");
      return;
    }
    setMessage("Invoice lines saved.");
    router.refresh();
  }

  async function finalize() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/invoices/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ detail_ids: [Number(detail.sl_no)] }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not finalize invoice");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div> : null}
      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{message}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[1.05fr_1.7fr]">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Invoice details</div>
          </div>
          <div className="space-y-3 p-5">
            <ReadOnly label="Invoice no" value={String(detail.invoice_no || "Not assigned")} />
            <ReadOnly label="Job" value={`#${String(issue.job_no ?? detail.job_no)}`} />
            <ReadOnly label="Date" value={dateInputValue(detail.closing_date)} />
            <ReadOnly label="Property" value={property ? displayAddress(property) : String(issue.p_id ?? "")} />
            <ReadOnly label="Client" value={String(reporter?.reporter ?? "")} />
            <div>
              <label className="label">Reported issue</label>
              <textarea className="textarea min-h-[80px]" defaultValue={String(detail.reported_issue ?? "")} readOnly />
            </div>
            <div>
              <label className="label">Nominal</label>
              <select className="select" value={nCode} onChange={(e) => setNCode(e.target.value)}>
                <option value="">—</option>
                {accounts.map((row) => (
                  <option key={String(row.n_code)} value={String(row.n_code)}>
                    {String(row.n_code)} · {String(row.nominal)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <select className="select" value={dCode} onChange={(e) => setDCode(e.target.value)}>
                <option value="">—</option>
                {departments.map((row) => (
                  <option key={String(row.d_code)} value={String(row.d_code)}>
                    {String(row.d_code)} · {String(row.name)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Invoice note</label>
              <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div>
              <label className="label">Discount (fixed)</label>
              <input type="number" step="0.01" className="input" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Invoice lines</div>
              <div className="text-xs text-slate-500">Labour, materials and certification.</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setLines((c) => [...c, { description: "", description_type: "Labour", quantity: "1", unit_price: "0" }])}>
              <Plus className="h-4 w-4" />
              Add line
            </button>
          </div>
          <div className="space-y-3 p-5">
            {lines.map((line, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[130px_1fr_90px_100px_100px_40px]">
                <select className="select" value={line.description_type} onChange={(e) => update(index, { description_type: e.target.value })}>
                  {lineTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <input className="input" placeholder="Description" value={line.description} onChange={(e) => update(index, { description: e.target.value })} />
                <input className="input" type="number" step="0.5" value={line.quantity} onChange={(e) => update(index, { quantity: e.target.value })} />
                <input className="input" type="number" step="0.01" value={line.unit_price} onChange={(e) => update(index, { unit_price: e.target.value })} />
                <div className="flex items-center justify-end text-sm font-bold text-slate-700">
                  {money(Number(line.quantity || 0) * Number(line.unit_price || 0))}
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => setLines((c) => c.filter((_, i) => i !== index))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            <div className="ml-auto mt-4 w-full max-w-xs space-y-1 rounded-xl bg-slate-50 p-4 text-sm">
              <Total label="Lines net" value={money(totals.net)} />
              <Total label="Discount" value={`- ${money(totals.discount)}`} />
              <Total label="Net after discount" value={money(totals.netAfterDiscount)} />
              <Total label="VAT (20%)" value={money(totals.vat)} />
              <Total label="Gross" value={money(totals.total)} strong />
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button className="btn btn-secondary" onClick={save} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save invoice
              </button>
              <button className="btn btn-primary" onClick={finalize} disabled={busy || Boolean(detail.invoice_no)}>
                Generate invoice number
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">{value || "—"}</div>
    </div>
  );
}

function Total({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "border-t border-slate-200 pt-1 text-base font-black" : ""}`}>
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}
