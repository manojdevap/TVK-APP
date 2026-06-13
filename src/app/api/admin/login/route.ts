import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  isEmailAllowedAdmin,
} from "@/lib/auth/admin";

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  if (!isEmailAllowedAdmin(email)) {
    return NextResponse.json({ error: "Email not in ADMIN_EMAILS" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true, email: email.toLowerCase() });
  response.cookies.set(ADMIN_SESSION_COOKIE, email.toLowerCase(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
