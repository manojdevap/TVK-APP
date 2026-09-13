import { isValidEpic, normalizeEpic } from "@/lib/epic";
import { isValidCoordinates, roundCoordinate } from "@/lib/location";
import type { Gender } from "@/db/schema";

export class ValidationError extends Error {
  readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

const GENDERS: Gender[] = ["male", "female", "other"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requireText(value: unknown, field: string, label: string, max = 200): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new ValidationError(field, `${label} is required`);
  if (text.length > max) {
    throw new ValidationError(field, `${label} must be ${max} characters or fewer`);
  }
  return text;
}

export function optionalText(value: unknown, field: string, label: string, max = 500): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  if (text.length > max) {
    throw new ValidationError(field, `${label} must be ${max} characters or fewer`);
  }
  return text;
}

export function requireUuid(value: unknown, field: string, label: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!UUID_RE.test(text)) throw new ValidationError(field, `${label} is required`);
  return text;
}

export function requireGender(value: unknown): Gender {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!GENDERS.includes(text as Gender)) {
    throw new ValidationError("gender", "Choose a gender");
  }
  return text as Gender;
}

/**
 * Optional — a member can be added without one. Requiring a voter ID up front was
 * what made enrolling someone slow, so it is now something you can fill in later.
 */
export function optionalVoterId(value: unknown): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;

  const epic = normalizeEpic(raw);
  if (!isValidEpic(epic)) {
    throw new ValidationError(
      "voterId",
      "Voter ID must be 3 letters followed by 7 digits, e.g. ABC1234567"
    );
  }
  return epic;
}

/** Accepts the ways people actually type an Indian mobile number */
export function optionalPhone(value: unknown): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;

  const digits = raw.replace(/[\s()+-]/g, "");
  if (!/^\d{10,13}$/.test(digits)) {
    throw new ValidationError("phone", "Phone number must be 10 digits");
  }
  return digits.slice(-10);
}

export function optionalDate(value: unknown, field: string, label: string): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(Date.parse(raw))) {
    throw new ValidationError(field, `${label} must be a valid date`);
  }
  return raw;
}

export function optionalPositiveInt(value: unknown, field: string, label: string): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(n) || n < 1) {
    throw new ValidationError(field, `${label} must be a whole number of 1 or more`);
  }
  return n;
}

/** Turns a display name into a stable slug for a custom role */
export function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
}

/**
 * A map pin, or nothing at all.
 *
 * The two columns move together: a latitude without a longitude is not a place, so
 * one without the other is treated as no pin rather than as an error the person
 * filling in the form has to understand.
 */
export function optionalCoordinates(
  latitude: unknown,
  longitude: unknown
): { latitude: number; longitude: number } | { latitude: null; longitude: null } {
  const none = { latitude: null, longitude: null } as const;

  const lat = toNumber(latitude);
  const lng = toNumber(longitude);
  if (lat === null || lng === null) return none;

  if (!isValidCoordinates(lat, lng)) {
    throw new ValidationError("latitude", "That map location is not a valid place");
  }
  return { latitude: roundCoordinate(lat), longitude: roundCoordinate(lng) };
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}
