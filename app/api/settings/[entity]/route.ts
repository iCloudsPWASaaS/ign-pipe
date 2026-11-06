import { fail, ok, readJson, requireApiSession, searchParams } from "@/lib/api";
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

export async function GET(
  request: Request,
  context: { params: Promise<{ entity: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;

  const { entity } = await context.params;
  const def = getEntityDef(entity);
  if (!def) return fail("Unknown settings entity", 404);

  const params = searchParams(request);
  const q = (params.get("q") || "").trim();
  const limit = Math.min(Number(params.get("limit") || 200), 1000);

  const db = getAdminClient();
  let query = db.from(def.table).select("*").order(def.pk, { ascending: true }).limit(limit);
  if (q && def.searchable.length) {
    query = query.or(def.searchable.map((column) => `${column}.ilike.%${q}%`).join(","));
  }

  const { data, error } = await query;
  if (error) return fail(error.message, 500);
  return ok({ data: data ?? [] });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ entity: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);

  const { entity } = await context.params;
  const def = getEntityDef(entity);
  if (!def) return fail("Unknown settings entity", 404);

  const body = await readJson<Record<string, unknown>>(request);
  const payload = normalize(def, body);
  const required = def.fields.filter((field) => field.required);
  for (const field of required) {
    if (!payload[field.name]) {
      return fail(`${field.label} is required`, 400);
    }
  }

  const db = getAdminClient();
  const { data, error } = await db.from(def.table).insert(payload).select("*").single();
  if (error) return fail(error.message, 500);
  return ok({ data }, { status: 201 });
}
