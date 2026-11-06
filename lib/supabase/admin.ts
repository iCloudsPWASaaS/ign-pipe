import { createClient } from "@supabase/supabase-js";

type AdminClient = any;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "pipe";

if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

let adminClient: AdminClient | null = null;

export function getAdminClient(): AdminClient {
  if (!adminClient) {
    adminClient = (createClient as any)(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema },
    });
  }
  return adminClient;
}

export const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || "pipe";
