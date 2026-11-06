import { getAdminClient } from "./supabase/admin";

export async function getLookupData() {
  const db = getAdminClient();
  const [properties, reporters, contractors, suppliers, accounts, departments] = await Promise.all([
    db
      .from("property")
      .select("p_id,p_code,p_name,p_no,p_location,post_code,r_id,tenant,tenant_phone,tenant_email,landlord,landlord_phone,landlord_email,key_no,p_type,gas,pir,lra,pat,reg,sl_no,n_code,d_code,active")
      .order("p_name")
      .limit(2000),
    db.from("reporter").select("r_id,reporter,reporter_code,phone,email,address,n_code,n_code2,d_code").order("reporter").limit(2000),
    db.from("contractor").select("c_id,contractor,mobile,email,color,tradesman,d_code,active").eq("active", 1).order("contractor").limit(500),
    db.from("supplier").select("s_id,s_code,supplier,phone,email,n_code,d_code,active").eq("active", 1).order("supplier").limit(500),
    db.from("account").select("sl_no,nominal,n_code,active").eq("active", 1).order("nominal").limit(500),
    db.from("department").select("sl_no,name,d_code").order("name").limit(500),
  ]);

  return {
    properties: properties.data ?? [],
    reporters: reporters.data ?? [],
    contractors: contractors.data ?? [],
    suppliers: suppliers.data ?? [],
    accounts: accounts.data ?? [],
    departments: departments.data ?? [],
  };
}

export type LookupData = Awaited<ReturnType<typeof getLookupData>>;
