"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { members, roles } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";
import { deletePhoto, isAppPhotoUrl } from "@/lib/storage/photos";
import {
  optionalCoordinates,
  optionalDate,
  optionalPhone,
  optionalText,
  optionalVoterId,
  requireGender,
  requireText,
  requireUuid,
  ValidationError,
} from "@/lib/validation";
import { toFailure, type ActionResult } from "./action-result";

export type MemberInput = {
  fullName: string;
  wardId: string;
  roleId: string;
  gender: string;
  phone?: string;
  address?: string;
  voterId?: string;
  /** Both or neither — a latitude alone is not a place */
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string;
  joinedOn?: string;
  notes?: string;
};

function parse(input: MemberInput) {
  return {
    fullName: requireText(input.fullName, "fullName", "Name"),
    wardId: requireUuid(input.wardId, "wardId", "Ward"),
    roleId: requireUuid(input.roleId, "roleId", "Role"),
    gender: requireGender(input.gender),
    phone: optionalPhone(input.phone),
    address: optionalText(input.address, "address", "Address") ?? "",
    voterId: optionalVoterId(input.voterId),
    ...optionalCoordinates(input.latitude, input.longitude),
    photoUrl: optionalPhotoUrl(input.photoUrl),
    joinedOn: optionalDate(input.joinedOn, "joinedOn", "Joined on"),
    notes: optionalText(input.notes, "notes", "Notes", 1000),
  };
}

/** The browser only ever sends back a URL this server issued */
function optionalPhotoUrl(value: unknown): string | null {
  const url = typeof value === "string" ? value.trim() : "";
  if (!url) return null;

  if (!isAppPhotoUrl(url, "members")) {
    throw new ValidationError("photoUrl", "That photo could not be saved");
  }
  return url;
}

/**
 * Some positions are capped per ward — Organiser is one per ward by default.
 *
 * The Neon HTTP driver has no transactions, so this reads then writes. For a roster
 * maintained by a handful of admins that is acceptable; two people would have to
 * save the same position in the same ward within milliseconds to slip past it.
 */
async function assertRoleCapacity(roleId: string, wardId: string, excludeMemberId?: string) {
  const db = getDb();

  const [role] = await db
    .select({ maxPerWard: roles.maxPerWard, nameEn: roles.nameEn })
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  if (!role) throw new ValidationError("roleId", "That role no longer exists");
  if (role.maxPerWard === null) return;

  const [{ used }] = await db
    .select({ used: sql<number>`count(*)::int` })
    .from(members)
    .where(
      and(
        eq(members.wardId, wardId),
        eq(members.roleId, roleId),
        excludeMemberId ? ne(members.id, excludeMemberId) : undefined
      )
    );

  if (used >= role.maxPerWard) {
    throw new ValidationError(
      "roleId",
      role.maxPerWard === 1
        ? `This ward already has a ${role.nameEn}. Change the existing one first.`
        : `This ward already has ${role.maxPerWard} people as ${role.nameEn}.`
    );
  }
}

function revalidateMemberViews() {
  revalidatePath("/", "layout");
}

export async function createMember(input: MemberInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const values = parse(input);
    await assertRoleCapacity(values.roleId, values.wardId);

    const db = getDb();
    const [row] = await db.insert(members).values(values).returning({ id: members.id });

    revalidateMemberViews();
    return { ok: true, data: { id: row.id } };
  } catch (err) {
    return toFailure(err);
  }
}

export async function updateMember(
  id: string,
  input: MemberInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const memberId = requireUuid(id, "id", "Member");
    const values = parse(input);
    await assertRoleCapacity(values.roleId, values.wardId, memberId);

    const db = getDb();
    const [existing] = await db
      .select({ photoUrl: members.photoUrl })
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!existing) return toFailure(new Error("Member not found"));

    await db
      .update(members)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(members.id, memberId));

    // Only once the row is safely updated — a failed save must not lose the old photo.
    if (existing.photoUrl && existing.photoUrl !== values.photoUrl) {
      await deletePhoto(existing.photoUrl);
    }

    revalidateMemberViews();
    return { ok: true, data: { id: memberId } };
  } catch (err) {
    return toFailure(err);
  }
}

export async function deleteMember(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const memberId = requireUuid(id, "id", "Member");

    const db = getDb();
    const deleted = await db
      .delete(members)
      .where(eq(members.id, memberId))
      .returning({ photoUrl: members.photoUrl });

    if (!deleted.length) return toFailure(new Error("Member not found"));

    await deletePhoto(deleted[0].photoUrl);

    revalidateMemberViews();
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}
