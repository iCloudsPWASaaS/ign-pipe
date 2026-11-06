import { fail, ok, readJson, requireApiSession, searchParams } from "@/lib/api";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  const params = searchParams(request);
  const db = getAdminClient();
  let query = db.from("timesheet_view").select("*").order("date", { ascending: false }).limit(500);
  if (params.get("c_id")) query = query.eq("c_id", Number(params.get("c_id")));
  if (params.get("p_id")) query = query.eq("p_id", params.get("p_id"));
  if (params.get("from")) query = query.gte("date", params.get("from"));
  if (params.get("to")) query = query.lte("date", params.get("to"));
  const { data, error } = await query;
  if (error) return fail(error.message, 500);
  return ok({ data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);

  const body = await readJson<Record<string, unknown>>(request);
  const db = getAdminClient();
  const payload = {
    c_id: body.c_id ? Number(body.c_id) : null,
    date: body.date || null,
    start_time: body.start_time || null,
    end_time: body.end_time || null,
    description: String(body.description || ""),
    status: String(body.status || "Completed"),
    completion: String(body.completion || ""),
    p_id: body.p_id || null,
    target: Number(body.target || 480),
    material_used: String(body.material_used || ""),
    material_note: String(body.material_note || ""),
    works_carried: String(body.works_carried || ""),
    payment_received: Number(body.payment_received || 0),
    file_names: body.file_names || null,
  };
  const { data, error } = await db.from("timesheet").insert(payload).select("*").single();
  if (error) return fail(error.message, 500);
  return ok({ data }, { status: 201 });
}
