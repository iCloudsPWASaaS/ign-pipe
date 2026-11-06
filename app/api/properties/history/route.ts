import { fail, ok, requireApiSession, searchParams } from "@/lib/api";
import { getAdminClient } from "@/lib/supabase/admin";

type Row = Record<string, unknown>;

function dedupeJobs(rows: Row[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = String(row.job_no ?? "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;

  const params = searchParams(request);
  const code = (params.get("code") || "").trim();
  const pId = (params.get("p_id") || "").trim();
  if (!code && !pId) return fail("Property code is required", 400);

  const db = getAdminClient();
  let property: Row | null = null;

  if (pId) {
    const result = await db.from("property").select("*").eq("p_id", pId).maybeSingle();
    if (result.error) return fail(result.error.message, 500);
    property = result.data;
  } else {
    for (const column of ["p_code", "p_no", "p_id"]) {
      const result = await db.from("property").select("*").eq(column, code).limit(1).maybeSingle();
      if (result.error) return fail(result.error.message, 500);
      if (result.data) {
        property = result.data;
        break;
      }
    }
  }

  if (!property) return fail("Property not found", 404);

  const [issuesResult, appointmentsResult, purchasesResult, floatResult, freeInvoicesResult, quotesResult, timesheetsResult, reporterResult] =
    await Promise.all([
      db.from("issue_full").select("*").eq("p_id", property.p_id).order("job_no", { ascending: false }).limit(500),
      db.from("scheduler_view").select("*").eq("p_id", property.p_id).order("scheduler_date", { ascending: false }).limit(300),
      db.from("purchase").select("*").eq("p_id", property.p_id).order("inv_date", { ascending: false }).limit(300),
      db.from("cashfloat").select("*").eq("p_id", property.p_id).order("inv_date", { ascending: false }).limit(300),
      db.from("invoicefree").select("*").eq("p_id", property.p_id).order("invoice_date", { ascending: false }).limit(300),
      db.from("quote_view").select("*").eq("p_id", property.p_id).order("quote_date", { ascending: false }).limit(300),
      db.from("timesheet_view").select("*").eq("p_id", property.p_id).order("date", { ascending: false }).limit(300),
      db.from("reporter").select("*").eq("r_id", property.r_id).maybeSingle(),
    ]);

  const issues = dedupeJobs(issuesResult.data ?? []);
  const jobNos = issues.map((issue) => Number(issue.job_no)).filter(Boolean);

  let jobInvoiceRows: Row[] = [];
  if (jobNos.length) {
    const result = await db
      .from("control_sheet_approved")
      .select("sl_no,job_no,invoice_no,invoice_status,issue_invoiced,closing_date,reported_issue,status")
      .in("job_no", jobNos)
      .not("invoice_no", "is", null)
      .limit(500);
    jobInvoiceRows = result.data ?? [];
  }

  const freeInvoices: Row[] = freeInvoicesResult.data ?? [];
  const detailKeys = [
    ...freeInvoices.map((row) => String(row.invoice_no ?? "")).filter(Boolean),
    ...jobInvoiceRows.map((row) => String(row.sl_no ?? "")).filter(Boolean),
  ];

  const totals = new Map<string, number>();
  if (detailKeys.length) {
    const result = await db
      .from("invoice_detail")
      .select("reported_issue_no,quantity,unit_price")
      .in("reported_issue_no", detailKeys)
      .limit(10000);
    for (const line of result.data ?? []) {
      const key = String(line.reported_issue_no);
      const value = Number(line.quantity || 0) * Number(line.unit_price || 0);
      totals.set(key, (totals.get(key) ?? 0) + value);
    }
  }

  const invoices = [
    ...freeInvoices.map((row) => ({
      kind: "free" as const,
      invoice_no: String(row.invoice_no ?? ""),
      date: row.invoice_date,
      description: row.invoice_note,
      status: Number(row.invoice_status) === 1 ? "Final" : "Draft",
      total: totals.get(String(row.invoice_no)) ?? 0,
      detail_id: null,
    })),
    ...jobInvoiceRows.map((row) => ({
      kind: "job" as const,
      invoice_no: String(row.invoice_no ?? ""),
      date: row.closing_date,
      description: row.reported_issue,
      status: row.status,
      total: totals.get(String(row.sl_no)) ?? 0,
      detail_id: row.sl_no,
    })),
  ].sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));

  return ok({
    property,
    reporter: reporterResult.data ?? null,
    issues,
    appointments: appointmentsResult.data ?? [],
    purchases: purchasesResult.data ?? [],
    cashfloat: floatResult.data ?? [],
    quotes: quotesResult.data ?? [],
    timesheets: timesheetsResult.data ?? [],
    invoices,
  });
}
