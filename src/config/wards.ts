import { municipality } from "./municipality";

/** Validate ward numbers for CSV import against municipality ward list */
export function isValidWardNumber(
  wardNumber: number,
  validNumbers: number[]
): boolean {
  return validNumbers.includes(wardNumber);
}

export const municipalityMeta = municipality;
