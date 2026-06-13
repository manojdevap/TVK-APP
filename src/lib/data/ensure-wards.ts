import { municipality } from "@/config/municipality";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Ensure Ward 1 … Ward N exist in DB (NG Municipality = 30 wards) */
export async function ensureWardSlots(supabase: SupabaseClient) {
  const { data: existing, error } = await supabase
    .from("wards")
    .select("number")
    .eq("municipality_slug", municipality.slug);

  if (error) throw error;

  const have = new Set((existing ?? []).map((w) => w.number));
  const missing = [];

  for (let n = 1; n <= municipality.wardCount; n++) {
    if (!have.has(n)) {
      missing.push({
        number: n,
        name_en: `Ward ${n}`,
        name_ta: `வார்டு ${n}`,
        area_en: "",
        area_ta: "",
        municipality_slug: municipality.slug,
      });
    }
  }

  if (missing.length > 0) {
    const { error: insertError } = await supabase.from("wards").insert(missing);
    if (insertError) throw insertError;
  }
}
