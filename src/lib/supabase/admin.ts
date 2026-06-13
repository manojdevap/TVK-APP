import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/** Service-role client for admin writes when env admin session is active */
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || !supabaseEnv.url) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations without OTP login");
  }
  return createClient(supabaseEnv.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseEnv.url);
}
