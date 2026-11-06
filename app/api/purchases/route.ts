import { fail, ok, readJson, requireApiSession, searchParams } from "@/lib/api";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  const params = searchParams(request);
  const db = getAdminClient();
  let query = db.from("purchase").select("*").order("sl_no", { ascending: false }).limit(500);
  if (params.get("p_id")) query = query.eq("p_id", params.get("p_id"));
  if (params.get("from")) query = query.gte("inv_date", params.get("from"));
  if (params.get("to")) query = query.lte("inv_date", params.get("to"));
  const { data, error } = await query;
  if (error) return fail(error.message, 500);
  return ok({ data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);

  const body = await readJson<Record<string, unknown>>(request);
  const cost = Number(body.cost || 0);
  const vat = Number(body.vat || 0);
  const db = getAdminClient();
  const { data, error } = await db
    .from("purchase")
    .insert({
      inv_no: body.inv_no || null,
      ref_no: body.ref_no || null,
      acc_ref: body.acc_ref || "0",
      inv_date: body.inv_date || null,
      rec_date: body.rec_date || null,
      s_code: body.s_code || null,
      n_code: body.n_code || "",
      description: body.description || "",
      cost,
      vat,
      vat_code: body.vat_code || "VAT20",
      total: Number(body.total || cost + vat),
      total_type: body.total_type || "net",
      in_amount: Number(body.in_amount || 0),
      p_id: body.p_id || null,
      status: body.status || "Open",
      d_code: body.d_code || "",
      product_sku: body.product_sku || "",
      product_qty: Number(body.product_qty || 0),
    })
    .select("*")
    .single();
  if (error) return fail(error.message, 500);
  return ok({ data }, { status: 201 });
}
