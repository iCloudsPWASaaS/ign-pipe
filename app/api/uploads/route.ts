import { fail, ok, requireApiSession } from "@/lib/api";
import { getAdminClient, storageBucket } from "@/lib/supabase/admin";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;

  const form = await request.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") || "uploads").replace(/[^a-zA-Z0-9/_-]/g, "");
  if (!(file instanceof File)) return fail("A file is required", 400);
  if (file.size > MAX_BYTES) return fail("File must be 10MB or smaller", 400);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${Date.now()}-${safeName}`;
  const db = getAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await db.storage.from(storageBucket).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) return fail(error.message, 500);

  const { data } = await db.storage.from(storageBucket).createSignedUrl(path, 60 * 60 * 24 * 7);
  return ok({ path, url: data?.signedUrl ?? null, bucket: storageBucket }, { status: 201 });
}
