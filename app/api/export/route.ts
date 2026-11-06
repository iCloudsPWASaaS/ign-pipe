import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireApiSession, searchParams } from "@/lib/api";

function csvValue(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: Record<string, unknown>[]) {
  const lines = [headers.map(csvValue).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvValue(row[header])).join(","));
  }
  return "\uFEFF" + lines.join("\r\n");
}

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;

  const type = searchParams(request).get("type") || "issues";
  const db = getAdminClient();
  let headers: string[] = [];
  let rows: Record<string, unknown>[] = [];

  if (type === "issues") {
    headers = ["job_no", "maintenance_date", "p_name", "p_no", "p_location", "post_code", "reported_issue", "priority", "status", "contractor", "closing_date", "invoice_no"];
    const { data } = await db.from("issue_full").select("*").order("job_no", { ascending: false }).limit(10000);
    rows = data ?? [];
  } else if (type === "timesheets") {
    headers = ["sl_no", "date", "contractor", "p_name", "start_time", "end_time", "description", "status", "material_used", "works_carried", "payment_received"];
    const { data } = await db.from("timesheet_view").select("*").order("date", { ascending: false }).limit(10000);
    rows = data ?? [];
  } else if (type === "purchases") {
    headers = ["sl_no", "inv_no", "inv_date", "s_code", "description", "cost", "vat", "total", "status"];
    const { data } = await db.from("purchase").select("*").order("sl_no", { ascending: false }).limit(10000);
    rows = data ?? [];
  } else if (type === "invoices") {
    headers = ["invoice_no", "invoice_date", "p_id", "r_id", "invoice_note", "invoice_status"];
    const { data } = await db.from("invoicefree").select("*").order("sl_no", { ascending: false }).limit(10000);
    rows = data ?? [];
  } else if (type === "properties") {
    headers = ["p_code", "p_name", "p_no", "p_location", "post_code", "landlord", "landlord_phone", "tenant", "tenant_phone", "active"];
    const { data } = await db.from("property").select("*").order("p_name").limit(10000);
    rows = data ?? [];
  } else if (type === "clients") {
    headers = ["r_id", "reporter", "reporter_code", "phone", "email", "address", "active"];
    const { data } = await db.from("reporter").select("*").order("reporter").limit(10000);
    rows = data ?? [];
  } else {
    return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
  }

  const csv = toCsv(headers, rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pipe-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
