import { fail, ok, readJson, requireApiSession } from "@/lib/api";
import { getAdminClient } from "@/lib/supabase/admin";

type Line = {
  description?: string;
  description_type?: string;
  quantity?: number | string;
  unit_price?: number | string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ detailId: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  const { detailId } = await context.params;
  const db = getAdminClient();

  const detail = await db.from("control_sheet_approved").select("*").eq("sl_no", Number(detailId)).maybeSingle();
  if (detail.error) return fail(detail.error.message, 500);
  if (!detail.data) return fail("Job line not found", 404);

  const [issue, lines] = await Promise.all([
    db.from("control_sheet").select("*").eq("job_no", detail.data.job_no).maybeSingle(),
    db.from("invoice_detail").select("*").eq("reported_issue_no", String(detailId)).order("sl_no"),
  ]);

  let property = null;
  let reporter = null;
  if (issue.data?.p_id) {
    const p = await db.from("property").select("*").eq("p_id", issue.data.p_id).maybeSingle();
    property = p.data;
    if (p.data?.r_id) {
      const r = await db.from("reporter").select("*").eq("r_id", p.data.r_id).maybeSingle();
      reporter = r.data;
    }
  }

  return ok({
    detail: detail.data,
    issue: issue.data ?? null,
    property,
    reporter,
    details: lines.data ?? [],
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ detailId: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);

  const { detailId } = await context.params;
  const body = await readJson<Record<string, unknown>>(request);
  const lines = (Array.isArray(body.details) ? body.details : []) as Line[];
  if (!lines.length) return fail("No invoice lines found. Please add at least one line.", 400);

  const db = getAdminClient();
  const { error: detailError } = await db
    .from("control_sheet_approved")
    .update({
      n_code: String(body.n_code || ""),
      d_code: String(body.d_code || ""),
      invoice_note: String(body.invoice_note || ""),
      discount_amount: Number(body.discount_amount || 0),
      updater: auth.session.user,
    })
    .eq("sl_no", Number(detailId));
  if (detailError) return fail(detailError.message, 500);

  await db.from("invoice_detail").delete().eq("reported_issue_no", String(detailId));
  const rows = lines.map((line) => ({
    reported_issue_no: String(detailId),
    description: String(line.description || ""),
    description_type: line.description_type || "Labour",
    quantity: Number(line.quantity || 0),
    unit_price: Number(line.unit_price || 0),
  }));
  const { error } = await db.from("invoice_detail").insert(rows);
  if (error) return fail(error.message, 500);
  return ok({ ok: true });
}
