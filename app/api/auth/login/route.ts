import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie, type SessionUser } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { readJson } from "@/lib/api";

type LoginBody = { username?: string; password?: string; email?: string };

export async function POST(request: Request) {
  const body = await readJson<LoginBody>(request);
  const username = (body.username || body.email || "").trim();
  const password = body.password || "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  let user: SessionUser | null = null;

  try {
    const db = getAdminClient();
    const { data, error } = await db
      .from("staff_profile")
      .select("id,user,pass,name,email,role,status")
      .eq("user", username)
      .limit(1)
      .maybeSingle();

    if (!error && data && String(data.pass) === password) {
      if (Number(data.status) === 0) {
        return NextResponse.json({ error: "This account is disabled" }, { status: 403 });
      }
      user = {
        sub: String(data.id),
        user: String(data.user),
        name: String(data.name || data.user),
        email: String(data.email || ""),
        role: Number(data.role || 2),
      };
    }
  } catch {
    // The schema may not have been applied yet; fall through to env admin login.
  }

  if (!user) {
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const adminPassword = process.env.ADMIN_PASSWORD || "";
    const isAdmin =
      adminPassword.length > 0 &&
      password === adminPassword &&
      (adminEmails.includes(username.toLowerCase()) ||
        username.toLowerCase() === "admin" ||
        adminEmails.length === 0);

    if (isAdmin) {
      user = {
        sub: "admin",
        user: username,
        name: "Administrator",
        email: username,
        role: 1,
      };
    }
  }

  if (!user) {
    return NextResponse.json({ error: "Login details do not match" }, { status: 401 });
  }

  const token = await createSessionToken(user);
  await setSessionCookie(token);
  return NextResponse.json({ ok: true, user });
}
