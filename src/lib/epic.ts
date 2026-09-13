/**
 * Indian EPIC (Electoral Photo Identity Card) number utilities.
 *
 * Standard modern format: 3 alphabetic characters + 7 digits, e.g. "ABC1234567".
 * The first 3 letters are the Functional Constituency (FC) code assigned by ECI.
 *
 * NOTE: We validate FORMAT only. The Election Commission of India provides no
 * free public API to verify an EPIC or fetch a voter's address, so verification
 * remains a manual step performed by the admin against the official electoral roll.
 */

const EPIC_REGEX = /^[A-Z]{3}[0-9]{7}$/;

/** Uppercase, strip spaces/hyphens */
export function normalizeEpic(raw: string | null | undefined): string {
  return (raw ?? "").toUpperCase().replace(/[\s-]/g, "");
}

export function isValidEpic(raw: string | null | undefined): boolean {
  return EPIC_REGEX.test(normalizeEpic(raw));
}

/** Normalize + assert valid EPIC, throwing a helpful message otherwise */
export function requireEpic(raw: string | null | undefined): string {
  const epic = normalizeEpic(raw);
  if (!epic) throw new Error("Voter ID (EPIC) is required");
  if (!EPIC_REGEX.test(epic)) {
    throw new Error("Voter ID must be 3 letters followed by 7 digits (e.g. ABC1234567)");
  }
  return epic;
}
