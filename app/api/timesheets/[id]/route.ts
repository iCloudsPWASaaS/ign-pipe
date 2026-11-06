import { fail, ok, readJson, requireApiSession } from "@/lib/api";
import { getAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);
  const { id } = await context.params;
  const body = await readJson<Record<string, unknown>>(request);
  const allowed = [
    "c_id",
    "date",
    "start_time",
    "end_time",
    "description",
    "status",
    "completion",
    "p_id",
    "material_used",
    "material_note",
    "works_carried",
    "payment_received",
    "file_names",
  ];
  const payload: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) payload[key] = body[key] === "" ? null : body[key];
  if (!Object.keys(payload).length) return fail("Nothing to update", 400);
  const db = getAdminClient();
  const { data, error } = await db.from("timesheet").update(payload).eq("sl_no", Number(id)).select("*").maybeSingle();
  if (error) return fail(error.message, 500);
  if (!data) return fail("Timesheet not found", 404);
  return ok({ data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);
  const { id } = await context.params;
  const db = getAdminClient();
  const { error } = await db.from("timesheet").delete().eq("sl_no", Number(id));
  if (error) return fail(error.message, 500);
  return ok({ ok: true });
}
