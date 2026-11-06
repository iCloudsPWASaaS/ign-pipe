"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { invoiceTotals } from "@/lib/invoice-totals";
import { dateInputValue, money } from "@/lib/format";
import { PropertyPicker, type PropertyOption } from "@/components/property-picker";

type Line = { description: string; description_type: string; quantity: string; unit_price: string };
type Row = Record<string, unknown>;

export function FreeInvoiceEditor({
  mode,
  invoiceNo,
  suggestedNo,
  initialInvoice,
  initialLines,
  properties,
  contractors,
  accounts,
  departments,
}: {
  mode: "create" | "edit";
  invoiceNo?: string;
  suggestedNo: string;
  initialInvoice: Row | null;
  initialLines: Row[];
  properties: Row[];
  contractors: Row[];
  accounts: Row[];
  departments: Row[];
}) {
  const router = useRouter();
  const [property, setProperty] = useState<PropertyOption | null>(
    (properties.find((row) => String(row.p_id) === String(initialInvoice?.p_id ?? "")) as PropertyOption | undefined) ?? null,
  );
  const [cId, setCId] = useState(String(initialInvoice?.c_id ?? ""));
  const [nCode, setNCode] = useState(String(initialInvoice?.n_code ?? ""));
  const [dCode, setDCode] = useState(String(initialInvoice?.d_code ?? ""));
  const [date, setDate] = useState(dateInputValue(initialInvoice?.invoice_date) || new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(String(initialInvoice?.invoice_note ?? ""));
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  const totals = invoiceTotals(
    lines.map((line) => ({ quantity: Number(line.quantity || 0), unit_price: Number(line.unit_price || 0) })),
  );

  function update(index: number, patch: Partial<Line>) {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    if (!property?.p_id) {
      setBusy(false);
      setError("Select a property.");
      return;
    }
    const payload = {
      invoice_no: invoiceNo,
      p_id: property.p_id,
      r_id: property?.r_id ?? initialInvoice?.r_id ?? 0,
      c_id: Number(cId || 0),
      n_code: nCode,
      d_code: dCode,
      invoice_date: date,
      invoice_note: note,
      details: lines,
    };
    const url = mode === "edit" ? `/api/invoices/${invoiceNo}` : "/api/invoices";
    const res = await fetch(url, {
      method: mode === "edit" ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { invoice_no?: string; error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not save invoice");
      return;
    }
    if (mode === "create" && data.invoice_no) {
      router.push(`/invoices/free/${data.invoice_no}`);
      router.refresh();
      return;
    }
    setMessage("Invoice saved.");
    router.refresh();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_1.7fr]">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Invoice header</div>
            <div className="text-xs text-slate-500">Number format follows the legacy PM sequence.</div>
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <label className="label">Invoice no</label>
            <input className="input" value={invoiceNo || suggestedNo} readOnly />
          </div>
          <div>
            <label className="label">Property</label>
            <PropertyPicker initialProperty={property} onSelect={setProperty} required />
          </div>
          <div>
            <label className="label">Invoice date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Contractor</label>
            <select className="select" value={cId} onChange={(e) => setCId(e.target.value)}>
              <option value="">—</option>
              {contractors.map((row) => (
                <option key={String(row.c_id)} value={String(row.c_id)}>{String(row.contractor)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Nominal</label>
            <select className="select" value={nCode} onChange={(e) => setNCode(e.target.value)}>
              <option value="">—</option>
              {accounts.map((row) => (
                <option key={String(row.n_code)} value={String(row.n_code)}>{String(row.n_code)} · {String(row.nominal)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Department</label>
            <select className="select" value={dCode} onChange={(e) => setDCode(e.target.value)}>
              <option value="">—</option>
              {departments.map((row) => (
                <option key={String(row.d_code)} value={String(row.d_code)}>{String(row.d_code)} · {String(row.name)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Invoice note</label>
            <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div> : null}
        {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{message}</div> : null}

        <div className="card">
          <div className="card-header">
            <div className="card-title">Invoice lines</div>
            <button className="btn btn-secondary btn-sm" onClick={() => setLines((c) => [...c, { description: "", description_type: "Labour", quantity: "1", unit_price: "0" }])}>
              <Plus className="h-4 w-4" />
              Add line
            </button>
          </div>
          <div className="space-y-3 p-5">
            {lines.map((line, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[130px_1fr_90px_100px_100px_40px]">
                <select className="select" value={line.description_type} onChange={(e) => update(index, { description_type: e.target.value })}>
                  <option value="Labour">Labour</option>
                  <option value="Material">Material</option>
                  <option value="Certification">Certification</option>
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
              <div className="flex justify-between"><span className="text-slate-500">Net</span><span>{money(totals.net)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">VAT (20%)</span><span>{money(totals.vat)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-black"><span>Gross</span><span>{money(totals.total)}</span></div>
            </div>

            <div className="flex justify-end">
              <button className="btn btn-primary" onClick={save} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {mode === "create" ? "Create invoice" : "Save invoice"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
