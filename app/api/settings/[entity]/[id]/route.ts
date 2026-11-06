import { fail, ok, readJson, requireApiSession } from "@/lib/api";
import { getEntityDef } from "@/lib/settings-config";
import { getAdminClient } from "@/lib/supabase/admin";

function normalize(def: ReturnType<typeof getEntityDef>, body: Record<string, unknown>) {
  if (!def) return {};
  const payload: Record<string, unknown> = {};
  for (const field of def.fields) {
    if (!(field.name in body)) continue;
    let value = body[field.name];
    if (value === "") value = null;
    if (value !== null && field.type === "number") value = Number(value);
    payload[field.name] = value;
  }
  return payload;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ entity: string; id: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);

  const { entity, id } = await context.params;
  const def = getEntityDef(entity);
  if (!def) return fail("Unknown settings entity", 404);

  const body = await readJson<Record<string, unknown>>(request);
  const payload = normalize(def, body);
  if (!Object.keys(payload).length) return fail("Nothing to update", 400);

  const db = getAdminClient();
  const { data, error } = await db
    .from(def.table)
    .update(payload)
    .eq(def.pk, id)
    .select("*")
    .maybeSingle();

  if (error) return fail(error.message, 500);
  if (!data) return fail("Record not found", 404);
  return ok({ data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ entity: string; id: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role !== 1) return fail("Forbidden", 403);

  const { entity, id } = await context.params;
  const def = getEntityDef(entity);
  if (!def) return fail("Unknown settings entity", 404);

  const db = getAdminClient();
  const { error } = await db.from(def.table).delete().eq(def.pk, id);
  if (error) return fail(error.message, 500);
  return ok({ ok: true });
}
