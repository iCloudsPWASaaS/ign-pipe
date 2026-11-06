"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { invoiceTotals } from "@/lib/invoice-totals";
import { money } from "@/lib/format";
import { PropertyPicker, type PropertyOption } from "@/components/property-picker";

type Line = { description: string; description_type: string; quantity: string; unit_price: string };
type Row = Record<string, unknown>;

export function QuoteEditor({
  mode,
  quoteNo,
  initialQuote,
  initialLines,
  properties,
}: {
  mode: "create" | "edit";
  quoteNo?: number;
  initialQuote: Row | null;
  initialLines: Row[];
  properties: Row[];
}) {
  const router = useRouter();
  const [property, setProperty] = useState<PropertyOption | null>(
    (properties.find((row) => String(row.p_id) === String(initialQuote?.p_id ?? "")) as PropertyOption | undefined) ?? null,
  );
  const [date, setDate] = useState(String(initialQuote?.quote_date ?? new Date().toISOString().slice(0, 10)).slice(0, 10));
  const [info, setInfo] = useState(String(initialQuote?.quote_info ?? ""));
  const [issueNo, setIssueNo] = useState(String(initialQuote?.issue_no ?? ""));
  const [reportedNo, setReportedNo] = useState(String(initialQuote?.reported_issue_no ?? ""));
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
      p_id: property.p_id,
      r_id: property?.r_id ?? 0,
      quote_date: date,
      quote_info: info,
      issue_no: issueNo || null,
      reported_issue_no: reportedNo || null,
      details: lines,
    };
    const res = await fetch(mode === "edit" ? `/api/quotes/${quoteNo}` : "/api/quotes", {
      method: mode === "edit" ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { quote_no?: number; error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not save quote");
      return;
    }
    if (mode === "create" && data.quote_no) {
      router.push(`/quotes/${data.quote_no}`);
      router.refresh();
      return;
    }
    setMessage("Quote saved.");
    router.refresh();
  }

  async function remove() {
    if (!quoteNo || !confirm("Delete this quote?")) return;
    setBusy(true);
    const res = await fetch(`/api/quotes/${quoteNo}`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not delete quote");
      return;
    }
    router.push("/quotes");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.6fr]">
      <div className="card">
        <div className="card-header"><div className="card-title">Quote details</div></div>
        <div className="space-y-3 p-5">
          {quoteNo ? (
            <div>
              <div className="label">Quote no</div>
              <div className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm font-bold">Q{quoteNo}</div>
            </div>
          ) : null}
          <div>
            <label className="label">Property</label>
            <PropertyPicker initialProperty={property} onSelect={setProperty} required />
          </div>
          <div>
            <label className="label">Quote date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Issue no</label>
              <input className="input" value={issueNo} onChange={(e) => setIssueNo(e.target.value)} />
            </div>
            <div>
              <label className="label">Job line ID</label>
              <input className="input" value={reportedNo} onChange={(e) => setReportedNo(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Quote information</label>
            <textarea className="textarea min-h-[140px]" value={info} onChange={(e) => setInfo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div> : null}
        {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{message}</div> : null}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Quote lines</div>
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
                <div className="flex items-center justify-end text-sm font-bold">{money(Number(line.quantity || 0) * Number(line.unit_price || 0))}</div>
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
            <div className="flex justify-end gap-2">
              {mode === "edit" ? (
                <button className="btn btn-danger" onClick={remove} disabled={busy}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : null}
              <button className="btn btn-primary" onClick={save} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {mode === "create" ? "Create quote" : "Save quote"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
