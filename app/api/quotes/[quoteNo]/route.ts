import { fail, ok, readJson, requireApiSession } from "@/lib/api";
import { getAdminClient } from "@/lib/supabase/admin";

type Line = {
  sl_no?: number;
  description?: string;
  description_type?: string;
  quantity?: number | string;
  unit_price?: number | string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ quoteNo: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  const { quoteNo } = await context.params;
  const db = getAdminClient();
  const [quote, details] = await Promise.all([
    db.from("quote").select("*").eq("quote_no", Number(quoteNo)).maybeSingle(),
    db.from("quote_detail").select("*").eq("quote_no", Number(quoteNo)).order("sl_no"),
  ]);
  if (quote.error) return fail(quote.error.message, 500);
  if (!quote.data) return fail("Quote not found", 404);
  return ok({ quote: quote.data, details: details.data ?? [] });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ quoteNo: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);
  const { quoteNo } = await context.params;
  const body = await readJson<Record<string, unknown>>(request);
  const db = getAdminClient();
  const no = Number(quoteNo);

  const { error: updateError } = await db
    .from("quote")
    .update({
      quote_date: body.quote_date || null,
      p_id: body.p_id || null,
      r_id: Number(body.r_id || 0),
      quote_info: String(body.quote_info || ""),
    })
    .eq("quote_no", no);
  if (updateError) return fail(updateError.message, 500);

  if (Array.isArray(body.details)) {
    await db.from("quote_detail").delete().eq("quote_no", no);
    const rows = (body.details as Line[]).map((line) => ({
      quote_no: no,
      description: String(line.description || ""),
      description_type: line.description_type || "Labour",
      quantity: Number(line.quantity || 0),
      unit_price: Number(line.unit_price || 0),
    }));
    if (rows.length) {
      const { error } = await db.from("quote_detail").insert(rows);
      if (error) return fail(error.message, 500);
    }
  }
  return ok({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ quoteNo: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role !== 1) return fail("Forbidden", 403);
  const { quoteNo } = await context.params;
  const db = getAdminClient();
  await db.from("quote_detail").delete().eq("quote_no", Number(quoteNo));
  const { error } = await db.from("quote").delete().eq("quote_no", Number(quoteNo));
  if (error) return fail(error.message, 500);
  return ok({ ok: true });
}
