"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { eventPhotos, events, members } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";
import { deletePhoto } from "@/lib/storage/photos";
import {
  optionalText,
  requireText,
  requireUuid,
  ValidationError,
} from "@/lib/validation";
import { toFailure, type ActionResult } from "./action-result";

export type EventScope = "ward" | "party";

export type EventInput = {
  title: string;
  eventDate: string;
  /** "ward" needs a wardId; "party" is organised by the whole party and has none */
  scope: EventScope;
  wardId?: string;
  description?: string;
  bannerUrl?: string;
  /** Gallery image URLs, already uploaded, in display order */
  galleryUrls?: string[];
  organiserId?: string;
};

function requireEventDate(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) throw new ValidationError("eventDate", "Date is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(Date.parse(raw))) {
    throw new ValidationError("eventDate", "Date must be a valid calendar date");
  }
  return raw;
}

const MAX_GALLERY = 30;

/** Only URLs this server issued are accepted back from the browser */
function isOurEventPhoto(url: string): boolean {
  return url.startsWith("/uploads/events/") || /^https:\/\/[\w.-]+\/events\/[\w.-]+$/.test(url);
}

function optionalBannerUrl(value: unknown): string | null {
  const url = typeof value === "string" ? value.trim() : "";
  if (!url) return null;
  if (!isOurEventPhoto(url)) throw new ValidationError("bannerUrl", "That photo could not be saved");
  return url;
}

function parseGallery(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const urls = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((url) => url.length > 0);

  // A repeated URL would mean deleting a file that another row still points at.
  const unique = [...new Set(urls)];

  if (unique.length > MAX_GALLERY) {
    throw new ValidationError("galleryUrls", `A gallery can hold at most ${MAX_GALLERY} photos`);
  }
  for (const url of unique) {
    if (!isOurEventPhoto(url)) {
      throw new ValidationError("galleryUrls", "One of those photos could not be saved");
    }
  }
  return unique;
}

/**
 * The organiser is a member, so an unknown id is rejected rather than stored — a
 * dangling reference would show an event with nobody responsible for it.
 */
async function resolveOrganiser(value: unknown): Promise<string | null> {
  const id = typeof value === "string" ? value.trim() : "";
  if (!id) return null;

  const organiserId = requireUuid(id, "organiserId", "Organiser");
  const db = getDb();
  const [found] = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.id, organiserId))
    .limit(1);

  if (!found) throw new ValidationError("organiserId", "That member no longer exists");
  return found.id;
}

/**
 * Scope is explicit rather than inferred from an empty ward, so forgetting to pick a
 * ward is caught as a mistake instead of silently filing a ward meeting as party-wide.
 */
function resolveWard(input: EventInput): string | null {
  if (input.scope === "party") return null;
  if (input.scope !== "ward") throw new ValidationError("scope", "Choose who is organising");
  return requireUuid(input.wardId, "wardId", "Ward");
}

async function parse(input: EventInput) {
  return {
    title: requireText(input.title, "title", "Title", 160),
    eventDate: requireEventDate(input.eventDate),
    wardId: resolveWard(input),
    description: optionalText(input.description, "description", "Description", 2000),
    bannerUrl: optionalBannerUrl(input.bannerUrl),
    organiserId: await resolveOrganiser(input.organiserId),
  };
}

/**
 * Brings the stored gallery in line with the submitted list: new URLs are inserted,
 * dropped ones are removed from the table and then from storage.
 *
 * The Neon HTTP driver has no transactions, so rows are written before any file is
 * deleted — a half-applied change leaves an unused file, never a broken image.
 */
async function syncGallery(eventId: string, urls: string[]) {
  const db = getDb();

  const existing = await db
    .select({ id: eventPhotos.id, url: eventPhotos.url })
    .from(eventPhotos)
    .where(eq(eventPhotos.eventId, eventId));

  const keep = new Set(urls);
  const removed = existing.filter((row) => !keep.has(row.url));
  const existingUrls = new Set(existing.map((row) => row.url));
  const added = urls.filter((url) => !existingUrls.has(url));

  if (removed.length) {
    await db.delete(eventPhotos).where(
      inArray(
        eventPhotos.id,
        removed.map((row) => row.id)
      )
    );
  }

  if (added.length) {
    await db
      .insert(eventPhotos)
      .values(added.map((url) => ({ eventId, url, sortOrder: urls.indexOf(url) })));
  }

  // Keep the stored order matching what was submitted.
  for (const row of existing) {
    const position = urls.indexOf(row.url);
    if (position >= 0) {
      await db.update(eventPhotos).set({ sortOrder: position }).where(eq(eventPhotos.id, row.id));
    }
  }

  for (const row of removed) await deletePhoto(row.url);
}

function revalidateEventViews() {
  revalidatePath("/", "layout");
}

export async function createEvent(input: EventInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const values = await parse(input);

    const gallery = parseGallery(input.galleryUrls);

    const db = getDb();
    const [row] = await db.insert(events).values(values).returning({ id: events.id });

    if (gallery.length) await syncGallery(row.id, gallery);

    revalidateEventViews();
    return { ok: true, data: { id: row.id } };
  } catch (err) {
    return toFailure(err);
  }
}

export async function updateEvent(
  id: string,
  input: EventInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const eventId = requireUuid(id, "id", "Event");
    const values = await parse(input);

    const db = getDb();
    const [existing] = await db
      .select({ bannerUrl: events.bannerUrl })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!existing) return toFailure(new Error("Event not found"));

    await db
      .update(events)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(events.id, eventId));

    await syncGallery(eventId, parseGallery(input.galleryUrls));

    // Only after the row is safely saved — a failed update must not lose the old photo.
    if (existing.bannerUrl && existing.bannerUrl !== values.bannerUrl) {
      await deletePhoto(existing.bannerUrl);
    }

    revalidateEventViews();
    return { ok: true, data: { id: eventId } };
  } catch (err) {
    return toFailure(err);
  }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const eventId = requireUuid(id, "id", "Event");

    const db = getDb();

    // Read the gallery first: the rows cascade away with the event, but the stored
    // files would be left behind with nothing pointing at them.
    const gallery = await db
      .select({ url: eventPhotos.url })
      .from(eventPhotos)
      .where(eq(eventPhotos.eventId, eventId));

    const deleted = await db
      .delete(events)
      .where(eq(events.id, eventId))
      .returning({ bannerUrl: events.bannerUrl });

    if (!deleted.length) return toFailure(new Error("Event not found"));

    await deletePhoto(deleted[0].bannerUrl);
    for (const photo of gallery) await deletePhoto(photo.url);

    revalidateEventViews();
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}
