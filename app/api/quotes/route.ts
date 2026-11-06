import { fail, ok, readJson, requireApiSession, searchParams } from "@/lib/api";
import { getAdminClient } from "@/lib/supabase/admin";

type Line = {
  description?: string;
  description_type?: string;
  quantity?: number | string;
  unit_price?: number | string;
};

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  const params = searchParams(request);
  const q = (params.get("q") || "").trim();
  const db = getAdminClient();
  let query = db.from("quote_view").select("*").limit(500);
  if (q) query = query.or(`quote_info.ilike.%${q}%,p_name.ilike.%${q}%,p_no.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) return fail(error.message, 500);
  return ok({ data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);

  const body = await readJson<Record<string, unknown>>(request);
  const lines = (Array.isArray(body.details) ? body.details : []) as Line[];
  if (!body.p_id) return fail("Property is required", 400);
  if (!lines.length) return fail("Add at least one quote line", 400);

  const db = getAdminClient();
  const { data: quote, error } = await db
    .from("quote")
    .insert({
      quote_date: body.quote_date || new Date().toISOString().slice(0, 10),
      s_id: body.s_id ? Number(body.s_id) : null,
      r_id: body.r_id ? Number(body.r_id) : 0,
      p_id: body.p_id,
      issue_no: body.issue_no ? Number(body.issue_no) : null,
      reported_issue_no: body.reported_issue_no ? Number(body.reported_issue_no) : null,
      quote_info: String(body.quote_info || ""),
    })
    .select("quote_no")
    .single();
  if (error) return fail(error.message, 500);

  const detailRows = lines.map((line) => ({
    quote_no: quote.quote_no,
    description: String(line.description || ""),
    description_type: line.description_type || "Labour",
    quantity: Number(line.quantity || 0),
    unit_price: Number(line.unit_price || 0),
  }));
  const { error: detailError } = await db.from("quote_detail").insert(detailRows);
  if (detailError) {
    await db.from("quote").delete().eq("quote_no", quote.quote_no);
    return fail(detailError.message, 500);
  }
  return ok({ quote_no: quote.quote_no }, { status: 201 });
}
