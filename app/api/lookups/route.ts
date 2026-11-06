import { fail, ok, requireApiSession, searchParams } from "@/lib/api";
import { getAdminClient } from "@/lib/supabase/admin";

const lookups = {
  properties: {
    table: "property",
    select: "p_id,p_code,p_name,p_no,p_location,post_code,r_id,tenant,tenant_phone,tenant_email,landlord,landlord_phone,landlord_email,key_no,p_type,gas,pir,lra,pat,reg,active,n_code,d_code",
    search: ["p_code", "p_name", "p_no", "p_location", "post_code", "p_id"],
    order: "p_name",
  },
  reporters: {
    table: "reporter",
    select: "r_id,reporter,reporter_code,phone,email,address,n_code,n_code2,d_code,active,account_status",
    search: ["reporter", "reporter_code", "email", "phone"],
    order: "reporter",
  },
  contractors: {
    table: "contractor",
    select: "c_id,contractor,mobile,email,color,tradesman,d_code,active,subcontractor_portal",
    search: ["contractor", "email", "mobile", "tradesman"],
    order: "contractor",
  },
  suppliers: {
    table: "supplier",
    select: "s_id,s_code,supplier,phone,email,n_code,d_code,active",
    search: ["supplier", "s_code", "email"],
    order: "supplier",
  },
  accounts: {
    table: "account",
    select: "sl_no,nominal,n_code,active",
    search: ["nominal", "n_code"],
    order: "nominal",
  },
  departments: {
    table: "department",
    select: "sl_no,name,d_code",
    search: ["name", "d_code"],
    order: "name",
  },
  materials: {
    table: "material",
    select: "id,s_code,product_detail,product_code,schedule_id,purchased,additional_comment",
    search: ["product_detail", "product_code", "s_code"],
    order: "product_detail",
  },
  staff: {
    table: "staff_profile",
    select: "id,user,name,email,phone,role,status,label",
    search: ["user", "name", "email"],
    order: "name",
  },
  certifications: {
    table: "certification",
    select: "cert_id,name,d_code",
    search: ["name", "d_code"],
    order: "name",
  },
  taxes: {
    table: "taxes",
    select: "id,name,value,hidden,\"default\"",
    search: ["name"],
    order: "name",
  },
} as const;

type LookupType = keyof typeof lookups;

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;

  const params = searchParams(request);
  const type = (params.get("type") || "properties") as LookupType;
  const def = lookups[type];
  if (!def) return fail("Unknown lookup type", 400);

  const q = (params.get("q") || "").trim();
  const limit = Math.min(Number(params.get("limit") || 50), 500);

  const db = getAdminClient();
  let query = db.from(def.table).select(def.select).limit(limit);
  if (q && def.search.length) {
    query = query.or(def.search.map((column) => `${column}.ilike.%${q}%`).join(","));
  }
  const { data, error } = await query.order(def.order, { ascending: true });
  if (error) return fail(error.message, 500);
  return ok({ data: data ?? [] });
}
