import { Clock3 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { LedgerManager } from "@/components/ledger-manager";
import { getLookupData } from "@/lib/lookups";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function TimesheetsPage() {
  const [lookups, rows] = await Promise.all([
    getLookupData(),
    getAdminClient().from("timesheet_view").select("*").order("date", { ascending: false }).limit(500),
  ]);

  return (
    <div>
      <PageHeader
        title="Timesheet"
        description="Contractor time entries, completion notes and materials used."
        icon={Clock3}
      />
      <LedgerManager
        endpoint="/api/timesheets"
        pk="sl_no"
        initialRows={rows.data ?? []}
        lookups={lookups}
        columns={[
          { key: "date", label: "Date", format: "date" },
          { key: "contractor", label: "Contractor" },
          { key: "p_name", label: "Property" },
          { key: "start_time", label: "Start" },
          { key: "end_time", label: "End" },
          { key: "description", label: "Description" },
          { key: "status", label: "Status" },
        ]}
        fields={[
          { name: "date", label: "Date", type: "date" },
          { name: "c_id", label: "Contractor", type: "select", lookup: "contractors" },
          { name: "start_time", label: "Start time", type: "time" },
          { name: "end_time", label: "End time", type: "time" },
          { name: "p_id", label: "Property", type: "select", lookup: "properties" },
          { name: "status", label: "Status", type: "select", options: [{ value: "Completed", label: "Completed" }, { value: "Open", label: "Open" }, { value: "Reviewed", label: "Reviewed" }] },
          { name: "completion", label: "Completion" },
          { name: "description", label: "Description", type: "textarea", span: 2 },
          { name: "material_used", label: "Material used", type: "textarea" },
          { name: "material_note", label: "Material note", type: "textarea" },
          { name: "works_carried", label: "Works carried out", type: "textarea", span: 2 },
          { name: "payment_received", label: "Payment received", type: "number" },
        ]}
      />
    </div>
  );
}
