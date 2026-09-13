import type { Department } from "@/db/schema";
import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * "Other" on its own tells a reader nothing, so when it is chosen the typed name is
 * shown instead of the generic word.
 */
export function departmentLabel(
  department: Department,
  departmentOther: string | null,
  dict: Dictionary
): string {
  if (department === "other" && departmentOther) return departmentOther;
  return dict.departments[department];
}

/** The ward it concerns, or the whole town when there is no ward */
export function scopeLabel(wardNumber: number | null, dict: Dictionary): string {
  return wardNumber ? `${dict.wards.ward} ${wardNumber}` : dict.petitions.municipalityWide;
}
