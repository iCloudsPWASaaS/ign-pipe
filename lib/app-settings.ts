import { cache } from "react";
import { getAdminClient } from "./supabase/admin";

export type AppSettings = {
  appName: string;
  appSubtitle: string;
  organization: string;
  email: string;
  website: string;
  address: string;
  logo: string;
};

const fallbackName = process.env.NEXT_PUBLIC_APP_NAME || "Pipe Medic UK";
const fallbackSubtitle = process.env.NEXT_PUBLIC_APP_SUBTITLE || "Operations CRM";

export const getAppSettings = cache(async (): Promise<AppSettings> => {
  try {
    const db = getAdminClient();
    const { data } = await db
      .from("config")
      .select("name,value")
      .in("name", [
        "organization",
        "name",
        "app_subtitle",
        "email",
        "website",
        "address",
        "logo",
      ]);

    const map = new Map<string, string>();
    for (const row of data ?? []) {
      const key = String(row.name ?? "").trim();
      const value = String(row.value ?? "").trim();
      if (key && value && !map.has(key)) map.set(key, value);
    }

    const organization = map.get("organization") || fallbackName;
    const appName = map.get("name") || organization || fallbackName;
    const appSubtitle = map.get("app_subtitle") || fallbackSubtitle;

    return {
      appName,
      appSubtitle,
      organization,
      email: map.get("email") || "",
      website: map.get("website") || "",
      address: map.get("address") || "",
      logo: map.get("logo") || "",
    };
  } catch {
    return {
      appName: fallbackName,
      appSubtitle: fallbackSubtitle,
      organization: fallbackName,
      email: "",
      website: "",
      address: "",
      logo: "",
    };
  }
});
