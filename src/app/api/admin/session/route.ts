import { NextResponse } from "next/server";
import { getAdminSessionEmail, isAdminUser } from "@/lib/auth/admin";

export async function GET() {
  const isAdmin = await isAdminUser();
  const email = await getAdminSessionEmail();
  return NextResponse.json({ isAdmin, email });
}
