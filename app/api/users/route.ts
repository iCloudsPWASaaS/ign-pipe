import { fail, ok, readJson, requireApiSession } from "@/lib/api";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role !== 1) return fail("Forbidden", 403);
  const { data, error } = await getAdminClient().from("staff_profile").select("*").order("name");
  if (error) return fail(error.message, 500);
  return ok({ data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role !== 1) return fail("Forbidden", 403);

  const body = await readJson<Record<string, unknown>>(request);
  if (!body.user || !body.pass || !body.name) return fail("Username, password and name are required", 400);

  const { data, error } = await getAdminClient()
    .from("staff_profile")
    .insert({
      user: String(body.user),
      pass: String(body.pass),
      name: String(body.name),
      photo: String(body.photo || "no-photo.jpg"),
      email: String(body.email || ""),
      phone: String(body.phone || ""),
      salary: Number(body.salary || 0),
      joindate: body.joindate || new Date().toISOString().slice(0, 10),
      label: String(body.label || "Staff"),
      role: Number(body.role || 2),
      status: Number(body.status ?? 1),
    })
    .select("*")
    .single();
  if (error) return fail(error.message, 500);
  return ok({ data }, { status: 201 });
}
