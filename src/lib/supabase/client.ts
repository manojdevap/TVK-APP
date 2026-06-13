import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseEnv } from "./env";

export function createClient() {
  return createBrowserClient(supabaseEnv.url!, supabaseEnv.publishableKey!);
}

export { isSupabaseConfigured };
