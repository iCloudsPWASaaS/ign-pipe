import { fail, ok, readJson, requireApiSession, searchParams } from "@/lib/api";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  const job = searchParams(request).get("job_no");
  const db = getAdminClient();
  let query = db.from("part_details").select("*").order("part_id", { ascending: true });
  if (job) query = query.eq("job_no", Number(job));
  const { data, error } = await query.limit(500);
  if (error) return fail(error.message, 500);
  return ok({ data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);

  const body = await readJson<Record<string, unknown>>(request);
  if (!body.job_no) return fail("Job number is required", 400);
  const db = getAdminClient();
  const { data, error } = await db
    .from("part_details")
    .insert({
      job_no: Number(body.job_no),
      part_no: String(body.part_no || ""),
      part_description: String(body.part_description || ""),
      part_authorisation_no: String(body.part_authorisation_no || ""),
      s_code: String(body.s_code || ""),
    })
    .select("*")
    .single();
  if (error) return fail(error.message, 500);
  return ok({ data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);
  const id = searchParams(request).get("id");
  if (!id) return fail("Part id is required", 400);
  const db = getAdminClient();
  const { error } = await db.from("part_details").delete().eq("part_id", Number(id));
  if (error) return fail(error.message, 500);
  return ok({ ok: true });
}
