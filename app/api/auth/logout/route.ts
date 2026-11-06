import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { requestOrigin } from "@/lib/request-origin";

function redirectToLogin(request: Request) {
  return NextResponse.redirect(new URL("/login", requestOrigin(request)));
}

export async function GET(request: Request) {
  await clearSessionCookie();
  return redirectToLogin(request);
}

export async function POST(request: Request) {
  await clearSessionCookie();
  return redirectToLogin(request);
}
