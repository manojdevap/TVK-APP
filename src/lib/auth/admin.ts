import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_SESSION_COOKIE = "tvk_admin_email";

/** Comma-separated admin emails from ADMIN_EMAILS env (server-only) */
export function getAllowedAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowedAdmin(email: string): boolean {
  const allowed = getAllowedAdminEmails();
  if (!allowed.length) return false;
  return allowed.includes(email.trim().toLowerCase());
}

export async function getAdminSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const email = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (email && isEmailAllowedAdmin(email)) {
    return email.toLowerCase();
  }
  return null;
}

export async function isAdminUser(): Promise<boolean> {
  const sessionEmail = await getAdminSessionEmail();
  if (sessionEmail) return true;

  const allowed = getAllowedAdminEmails();
  if (!allowed.length) {
    return checkSupabaseAdminRole();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email && isEmailAllowedAdmin(user.email)) {
    return true;
  }

  return checkSupabaseAdminRole();
}

async function checkSupabaseAdminRole(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  return data?.role === "admin";
}
