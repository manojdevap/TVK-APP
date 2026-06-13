import type { Gender, UserRole } from "@/types";

export interface CsvVoterRow {
  username: string;
  address: string;
  voterId: string;
  wardNumber: number;
  gender: Gender;
  isOurVote: boolean;
  role?: UserRole;
  phone?: string;
}

export interface CsvParseResult {
  rows: CsvVoterRow[];
  errors: { line: number; message: string }[];
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseBool(value: string): boolean {
  const v = value.toLowerCase();
  return v === "true" || v === "yes" || v === "1" || v === "y";
}

function parseGender(value: string): Gender | null {
  const v = value.toLowerCase();
  if (v === "male" || v === "m" || v === "ஆண்") return "male";
  if (v === "female" || v === "f" || v === "பெண்") return "female";
  return null;
}

const validRoles: UserRole[] = [
  "ward_member",
  "ward_organiser",
  "ward_head",
  "admin",
];

export function parseVotersCsv(
  content: string,
  validWardNumbers?: number[]
): CsvParseResult {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      rows: [],
      errors: [{ line: 1, message: "CSV must have a header and at least one row" }],
    };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const wardCol = headers.includes("wardnumber")
    ? "wardnumber"
    : headers.includes("wardid")
      ? "wardid"
      : null;

  if (!wardCol) {
    return {
      rows: [],
      errors: [{ line: 1, message: "Missing column: wardNumber (or wardId)" }],
    };
  }

  const required = ["username", "address", "voterid", "gender", "isourvote"];
  const missing = required.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [{ line: 1, message: `Missing columns: ${missing.join(", ")}` }],
    };
  }

  const idx = (name: string) => headers.indexOf(name);
  const rows: CsvVoterRow[] = [];
  const errors: CsvParseResult["errors"] = [];

  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1;
    const cols = parseCsvLine(lines[i]);
    const get = (name: string) => cols[idx(name)] ?? "";

    const gender = parseGender(get("gender"));
    if (!gender) {
      errors.push({ line: lineNum, message: "Invalid gender (use male/female)" });
      continue;
    }

    const wardNumber = Number(get(wardCol));
    if (!Number.isFinite(wardNumber)) {
      errors.push({ line: lineNum, message: "Invalid ward number" });
      continue;
    }

    if (validWardNumbers && !validWardNumbers.includes(wardNumber)) {
      errors.push({
        line: lineNum,
        message: `Ward ${wardNumber} not in municipality ward list`,
      });
      continue;
    }

    const roleRaw = get("role");
    let role: UserRole | undefined;
    if (roleRaw) {
      if (!validRoles.includes(roleRaw as UserRole)) {
        errors.push({ line: lineNum, message: `Invalid role: ${roleRaw}` });
        continue;
      }
      role = roleRaw as UserRole;
    }

    rows.push({
      username: get("username"),
      address: get("address"),
      voterId: get("voterid"),
      wardNumber,
      gender,
      isOurVote: parseBool(get("isourvote")),
      role,
      phone: get("phone") || undefined,
    });
  }

  return { rows, errors };
}
