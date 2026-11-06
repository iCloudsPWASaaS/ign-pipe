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
  context: { params: Promise<{ invoiceNo: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  const { invoiceNo } = await context.params;
  const db = getAdminClient();
  const invoice = await db.from("invoicefree").select("*").eq("invoice_no", invoiceNo).maybeSingle();
  if (invoice.error) return fail(invoice.error.message, 500);
  if (!invoice.data) return fail("Invoice not found", 404);

  const [details, property] = await Promise.all([
    db.from("invoice_detail").select("*").eq("reported_issue_no", invoiceNo).order("sl_no"),
    db.from("property").select("*").eq("p_id", invoice.data.p_id).maybeSingle(),
  ]);

  let reporter = null;
  if (property.data?.r_id) {
    const result = await db.from("reporter").select("*").eq("r_id", property.data.r_id).maybeSingle();
    reporter = result.data;
  }

  return ok({
    invoice: invoice.data,
    details: details.data ?? [],
    property: property.data ?? null,
    reporter,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ invoiceNo: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);
  const { invoiceNo } = await context.params;
  const body = await readJson<Record<string, unknown>>(request);
  const db = getAdminClient();

  const { error: updateError } = await db
    .from("invoicefree")
    .update({
      p_id: body.p_id || null,
      r_id: Number(body.r_id || 0),
      c_id: Number(body.c_id || 0),
      n_code: String(body.n_code || ""),
      d_code: String(body.d_code || ""),
      invoice_date: body.invoice_date || null,
      invoice_note: String(body.invoice_note || ""),
    })
    .eq("invoice_no", invoiceNo);
  if (updateError) return fail(updateError.message, 500);

  if (Array.isArray(body.details)) {
    await db.from("invoice_detail").delete().eq("reported_issue_no", invoiceNo);
    const rows = (body.details as Line[]).map((line) => ({
      reported_issue_no: invoiceNo,
      description: String(line.description || ""),
      description_type: line.description_type || "Labour",
      quantity: Number(line.quantity || 0),
      unit_price: Number(line.unit_price || 0),
    }));
    if (rows.length) {
      const { error } = await db.from("invoice_detail").insert(rows);
      if (error) return fail(error.message, 500);
    }
  }
  return ok({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ invoiceNo: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);
  const { invoiceNo } = await context.params;
  const db = getAdminClient();
  await db.from("invoice_detail").delete().eq("reported_issue_no", invoiceNo);
  const { error } = await db.from("invoicefree").delete().eq("invoice_no", invoiceNo);
  if (error) return fail(error.message, 500);
  return ok({ ok: true });
}
