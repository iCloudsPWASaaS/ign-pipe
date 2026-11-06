"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { PropertyPicker, type PropertyOption } from "@/components/property-picker";


type Reporter = { r_id: number; reporter: string; phone: string; email: string };
type Contractor = { c_id: number; contractor: string; tradesman: string };

type Item = {
  reported_issue: string;
  priority: string;
  c_id: string;
  client_ref: string;
  issue_quoted: string;
  reported_issue_option_value: string;
  reported_issue_option_price: string;
};

const priorities = [
  { value: "EMG", label: "Emergency" },
  { value: "URG", label: "Urgent" },
  { value: "ROT", label: "Routine" },
];

const priceOptions = [
  { value: "Initial Inspection|42", label: "Initial Inspection — £42" },
  { value: "Annual Service|42", label: "Annual Service — £42" },
  { value: "Repair - No Heat or Hot Water|120", label: "Repair - No Heat or Hot Water — £120" },
  { value: "Repair - No Heating|120", label: "Repair - No Heating — £120" },
  { value: "Repair - No Hot Water|120", label: "Repair - No Hot Water — £120" },
  { value: "Purge and Relight|42", label: "Purge and Relight — £42" },
];

const emptyItem = (): Item => ({
  reported_issue: "",
  priority: "ROT",
  c_id: "",
  client_ref: "",
  issue_quoted: "0",
  reported_issue_option_value: "",
  reported_issue_option_price: "",
});

export function CreateIssueForm() {
  const router = useRouter();
  const [reporters, setReporters] = useState<Reporter[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [property, setProperty] = useState<PropertyOption | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [issueType, setIssueType] = useState("0");
  const [gsc, setGsc] = useState("");
  const [items, setItems] = useState<Item[]>([emptyItem()]);

  useEffect(() => {
    async function load() {
      try {
        const [r, c] = await Promise.all([
          fetch("/api/lookups?type=reporters&limit=500").then((res) => res.json()),
          fetch("/api/lookups?type=contractors&limit=500").then((res) => res.json()),
        ]);
        setReporters((r.data ?? []) as Reporter[]);
        setContractors((c.data ?? []) as Contractor[]);
      } catch {
        setError("Could not load property/client lookups");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const reporter = useMemo(
    () => reporters.find((row) => Number(row.r_id) === Number(property?.r_id)) || null,
    [reporters, property],
  );

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!property) {
      setError("Select a property.");
      return;
    }
    const validItems = items.filter((item) => item.reported_issue.trim());
    if (!validItems.length) {
      setError("Add at least one reported issue.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        maintenance_date: date,
        p_id: property.p_id,
        issue_type: Number(issueType),
        gsc_boiler_service: 0,
        items: validItems.map((item) => {
          const [value, price] = item.reported_issue_option_value
            ? item.reported_issue_option_value.split("|")
            : [item.reported_issue, item.reported_issue_option_price];
          return {
            ...item,
            r_id: property.r_id,
            reported_issue_option_value: value,
            reported_issue_option_price: price,
          };
        }),
      }),
    });
    const data = (await res.json()) as { job_no?: number; error?: string };
    setSaving(false);
    if (!res.ok || !data.job_no) {
      setError(data.error || "Could not create issue");
      return;
    }
    router.push(`/issues/${data.job_no}`);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="card flex items-center gap-3 p-6 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading clients and contractors...
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1.1fr_1.6fr]">
      <div className="space-y-4">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Property & client</div>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <label className="label">Property</label>
              <PropertyPicker initialProperty={property} onSelect={setProperty} required />

            </div>

            {property ? (
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs">
                <Info label="Code" value={property.p_code} />
                <Info label="Client" value={reporter?.reporter || property.tenant} />
                <Info label="Tenant" value={property.tenant} />
                <Info label="Phone" value={property.tenant_phone || reporter?.phone} />
                <Info label="Landlord" value={property.landlord} />
                <Info label="Email" value={property.tenant_email || reporter?.email} />
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Issue date</label>
                <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Quote required?</label>
                <select className="select" value={items[0]?.issue_quoted || "0"} onChange={(e) => updateItem(0, { issue_quoted: e.target.value })}>
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
              <div>
                <label className="label">Non-issue</label>
                <select className="select" value={issueType} onChange={(e) => setIssueType(e.target.value)}>
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
              <div>
                <label className="label">Compliance</label>
                <select className="select" value={gsc} onChange={(e) => setGsc(e.target.value)}>
                  <option value="">None</option>
                  <option value="1">GSC</option>
                  <option value="2">EICR</option>
                  <option value="3">PAT</option>
                  <option value="4">EICR and PAT</option>
                  <option value="5">LRA</option>
                  <option value="6">Smoke Alarms</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="text-sm font-bold text-pipe-ink">Client contact</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <Info label="Reporter" value={reporter?.reporter} />
            <Info label="Reporter phone" value={reporter?.phone} />
            <Info label="Landlord" value={property?.landlord} />
            <Info label="Landlord phone" value={property?.landlord_phone} />
            <Info label="Tenant" value={property?.tenant} />
            <Info label="Tenant phone" value={property?.tenant_phone} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="card">
            <div className="card-header">
              <div className="card-title">Reported issue #{index + 1}</div>
              {items.length > 1 ? (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              ) : null}
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label">Reported issue</label>
                <textarea
                  className="textarea"
                  value={item.reported_issue}
                  onChange={(e) => updateItem(index, { reported_issue: e.target.value })}
                  placeholder="Describe the reported issue..."
                />
              </div>
              <div>
                <label className="label">Client reference</label>
                <input className="input" value={item.client_ref} onChange={(e) => updateItem(index, { client_ref: e.target.value })} />
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="select" value={item.priority} onChange={(e) => updateItem(index, { priority: e.target.value })}>
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Contractor</label>
                <select className="select" value={item.c_id} onChange={(e) => updateItem(index, { c_id: e.target.value })}>
                  <option value="">Unassigned</option>
                  {contractors.map((row) => (
                    <option key={row.c_id} value={row.c_id}>{row.contractor}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Pricing option</label>
                <select
                  className="select"
                  value={item.reported_issue_option_value ? item.reported_issue_option_value : ""}
                  onChange={(e) => updateItem(index, { reported_issue_option_value: e.target.value })}
                >
                  <option value="">None</option>
                  {priceOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}

        <button type="button" className="btn btn-secondary w-full" onClick={() => setItems((current) => [...current, emptyItem()])}>
          <Plus className="h-4 w-4" />
          Add another reported issue
        </button>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Creating..." : "Create issue"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 truncate font-semibold text-slate-700">{value || "—"}</div>
    </div>
  );
}
