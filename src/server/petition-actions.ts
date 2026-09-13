"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { members, petitionPhotos, petitions } from "@/db/schema";
import type { Department, PetitionStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";
import { deletePhoto, isAppPhotoUrl } from "@/lib/storage/photos";
import {
  optionalPhone,
  optionalText,
  requireText,
  requireUuid,
  ValidationError,
} from "@/lib/validation";
import { toFailure, type ActionResult } from "./action-result";

const MAX_PHOTOS = 20;

const STATUSES: PetitionStatus[] = ["submitted", "in_progress", "resolved", "rejected"];
const DEPARTMENTS: Department[] = [
  "electricity_board",
  "revenue_board",
  "corporation",
  "water_board",
  "police",
  "other",
];

export type PetitionScope = "ward" | "municipality";

export type PetitionInput = {
  title: string;
  /** "ward" needs a wardId; "municipality" affects the whole town and has none */
  scope: PetitionScope;
  wardId?: string;
  petitionerName: string;
  submittedOn: string;
  description?: string;
  petitionerPhone?: string;
  department?: string;
  departmentOther?: string;
  status?: string;
  handledById?: string;
  photoUrls?: string[];
};

function requireDepartment(value: unknown): Department {
  const found = DEPARTMENTS.find((d) => d === value);
  if (!found) throw new ValidationError("department", "Choose a department");
  return found;
}

function requireStatus(value: unknown): PetitionStatus {
  const found = STATUSES.find((s) => s === value);
  if (!found) throw new ValidationError("status", "Choose a status");
  return found;
}

function requireSubmittedOn(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) throw new ValidationError("submittedOn", "Date is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(Date.parse(raw))) {
    throw new ValidationError("submittedOn", "Date must be a valid calendar date");
  }
  return raw;
}

/** Only URLs this server issued are accepted back from the browser */
function isOurPetitionPhoto(url: string): boolean {
  return isAppPhotoUrl(url, "petitions");
}

function parsePhotos(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const urls = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((url) => url.length > 0);

  // A repeated URL would mean deleting a file another row still points at.
  const unique = [...new Set(urls)];

  if (unique.length > MAX_PHOTOS) {
    throw new ValidationError("photoUrls", `At most ${MAX_PHOTOS} photos can be attached`);
  }
  for (const url of unique) {
    if (!isOurPetitionPhoto(url)) {
      throw new ValidationError("photoUrls", "One of those photos could not be saved");
    }
  }
  return unique;
}

/** The member who took it up, if any — an unknown id is rejected rather than stored */
async function resolveHandler(value: unknown): Promise<string | null> {
  const id = typeof value === "string" ? value.trim() : "";
  if (!id) return null;

  const handlerId = requireUuid(id, "handledById", "Member");
  const db = getDb();
  const [found] = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.id, handlerId))
    .limit(1);

  if (!found) throw new ValidationError("handledById", "That member no longer exists");
  return found.id;
}

/**
 * Scope is explicit rather than inferred from an empty ward, so forgetting to pick a
 * ward is caught as a mistake instead of silently filing a street complaint as a
 * town-wide one.
 */
function resolveWard(input: PetitionInput): string | null {
  if (input.scope === "municipality") return null;
  if (input.scope !== "ward") throw new ValidationError("scope", "Choose who this affects");
  return requireUuid(input.wardId, "wardId", "Ward");
}

/** "Other" is only meaningful with a name attached, so the name becomes required */
function resolveDepartmentOther(department: Department, value: unknown): string | null {
  if (department !== "other") return null;
  return requireText(value, "departmentOther", "Department name", 80);
}

async function parse(input: PetitionInput) {
  const department = requireDepartment(input.department ?? "corporation");

  return {
    title: requireText(input.title, "title", "Title", 160),
    wardId: resolveWard(input),
    petitionerName: requireText(input.petitionerName, "petitionerName", "Petitioner name", 120),
    petitionerPhone: optionalPhone(input.petitionerPhone),
    description: optionalText(input.description, "description", "Description", 2000),
    department,
    departmentOther: resolveDepartmentOther(department, input.departmentOther),
    status: requireStatus(input.status ?? "submitted"),
    submittedOn: requireSubmittedOn(input.submittedOn),
    handledById: await resolveHandler(input.handledById),
  };
}

/**
 * Brings the stored photos in line with the submitted list. Rows are written before
 * any file is deleted, so a half-applied change leaves an unused file rather than a
 * broken image — the Neon HTTP driver has no transactions to lean on.
 */
async function syncPhotos(petitionId: string, urls: string[]) {
  const db = getDb();

  const existing = await db
    .select({ id: petitionPhotos.id, url: petitionPhotos.url })
    .from(petitionPhotos)
    .where(eq(petitionPhotos.petitionId, petitionId));

  const keep = new Set(urls);
  const removed = existing.filter((row) => !keep.has(row.url));
  const existingUrls = new Set(existing.map((row) => row.url));
  const added = urls.filter((url) => !existingUrls.has(url));

  if (removed.length) {
    await db.delete(petitionPhotos).where(
      inArray(
        petitionPhotos.id,
        removed.map((row) => row.id)
      )
    );
  }

  if (added.length) {
    await db
      .insert(petitionPhotos)
      .values(added.map((url) => ({ petitionId, url, sortOrder: urls.indexOf(url) })));
  }

  for (const row of existing) {
    const position = urls.indexOf(row.url);
    if (position >= 0) {
      await db
        .update(petitionPhotos)
        .set({ sortOrder: position })
        .where(eq(petitionPhotos.id, row.id));
    }
  }

  for (const row of removed) await deletePhoto(row.url);
}

function revalidatePetitionViews() {
  revalidatePath("/", "layout");
}

export async function createPetition(
  input: PetitionInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const values = await parse(input);
    const photos = parsePhotos(input.photoUrls);

    const db = getDb();
    const [row] = await db.insert(petitions).values(values).returning({ id: petitions.id });

    if (photos.length) await syncPhotos(row.id, photos);

    revalidatePetitionViews();
    return { ok: true, data: { id: row.id } };
  } catch (err) {
    return toFailure(err);
  }
}

export async function updatePetition(
  id: string,
  input: PetitionInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const petitionId = requireUuid(id, "id", "Petition");
    const values = await parse(input);
    const photos = parsePhotos(input.photoUrls);

    const db = getDb();
    const [existing] = await db
      .select({ id: petitions.id })
      .from(petitions)
      .where(eq(petitions.id, petitionId))
      .limit(1);

    if (!existing) return toFailure(new Error("Petition not found"));

    await db
      .update(petitions)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(petitions.id, petitionId));

    await syncPhotos(petitionId, photos);

    revalidatePetitionViews();
    return { ok: true, data: { id: petitionId } };
  } catch (err) {
    return toFailure(err);
  }
}

/** Moving a petition along its workflow, without opening the whole form */
export async function setPetitionStatus(id: string, status: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const petitionId = requireUuid(id, "id", "Petition");
    const next = requireStatus(status);

    const db = getDb();
    const updated = await db
      .update(petitions)
      .set({ status: next, updatedAt: new Date() })
      .where(eq(petitions.id, petitionId))
      .returning({ id: petitions.id });

    if (!updated.length) return toFailure(new Error("Petition not found"));

    revalidatePetitionViews();
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}

export async function deletePetition(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const petitionId = requireUuid(id, "id", "Petition");

    const db = getDb();

    // Read the photos first: the rows cascade away with the petition, but the stored
    // files would be left behind with nothing pointing at them.
    const photos = await db
      .select({ url: petitionPhotos.url })
      .from(petitionPhotos)
      .where(eq(petitionPhotos.petitionId, petitionId));

    const deleted = await db
      .delete(petitions)
      .where(eq(petitions.id, petitionId))
      .returning({ id: petitions.id });

    if (!deleted.length) return toFailure(new Error("Petition not found"));

    for (const photo of photos) await deletePhoto(photo.url);

    revalidatePetitionViews();
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}
