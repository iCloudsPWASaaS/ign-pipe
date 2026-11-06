import { fail, ok, readJson, requireApiSession, searchParams } from "@/lib/api";
import { nextInvoiceNumber } from "@/lib/invoice";
import { getAdminClient } from "@/lib/supabase/admin";

type Line = {
  description?: string;
  description_type?: string;
  quantity?: number | string;
  unit_price?: number | string;
};

function uniqueByDetail(rows: Record<string, unknown>[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = String(row.detail_id ?? row.job_no ?? "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  const params = searchParams(request);
  const mode = params.get("mode") === "sale" ? "sale" : "review";
  const q = (params.get("q") || "").trim();
  const db = getAdminClient();

  const view = mode === "sale" ? "sale_invoice_view" : "invoice_review_view";
  let query = db.from(view).select("*").limit(1000);
  if (q) query = query.or(`reported_issue.ilike.%${q}%,p_name.ilike.%${q}%,p_no.ilike.%${q}%,invoice_no.ilike.%${q}%`);
  const { data, error } = await query;

  if (error) {
    if (!error.message.toLowerCase().includes("not find") && error.code !== "PGRST205") {
      return fail(error.message, 500);
    }
  }

  if (mode === "sale" && !data) {
    const fallback = await db.from("invoicefree").select("*").order("invoice_date", { ascending: false }).limit(500);
    return ok({ data: fallback.data ?? [], mode });
  }

  return ok({ data: uniqueByDetail(data ?? []), mode });
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);

  const body = await readJson<Record<string, unknown>>(request);
  const lines = (Array.isArray(body.details) ? body.details : []) as Line[];
  if (!body.p_id) return fail("Property is required", 400);
  if (!lines.length) return fail("Add at least one invoice line", 400);

  const invoiceNo = String(body.invoice_no || "").trim() || (await nextInvoiceNumber("PM"));
  const db = getAdminClient();
  const invoiceDate = String(body.invoice_date || new Date().toISOString().slice(0, 10));

  const { error } = await db.from("invoicefree").insert({
    invoice_no: invoiceNo,
    invoice_note: String(body.invoice_note || ""),
    p_id: String(body.p_id),
    r_id: Number(body.r_id || 0),
    c_id: Number(body.c_id || 0),
    n_code: String(body.n_code || ""),
    d_code: String(body.d_code || ""),
    invoice_date: invoiceDate,
    invoice_created_date: new Date().toISOString().slice(0, 10),
    invoice_status: Number(body.invoice_status || 0),
  });
  if (error) return fail(error.message, 500);

  const detailRows = lines.map((line) => ({
    reported_issue_no: invoiceNo,
    description: String(line.description || ""),
    description_type: line.description_type || "Labour",
    quantity: Number(line.quantity || 0),
    unit_price: Number(line.unit_price || 0),
  }));
  const { error: detailError } = await db.from("invoice_detail").insert(detailRows);
  if (detailError) {
    await db.from("invoicefree").delete().eq("invoice_no", invoiceNo);
    return fail(detailError.message, 500);
  }

  return ok({ invoice_no: invoiceNo }, { status: 201 });
}
