"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { members, roles } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";
import {
  optionalPositiveInt,
  optionalText,
  requireText,
  requireUuid,
  toSlug,
  ValidationError,
} from "@/lib/validation";
import { toFailure, type ActionResult } from "./action-result";

export type RoleInput = {
  nameEn: string;
  nameTa?: string;
  /** Blank means any number of people in a ward may hold this position */
  maxPerWard?: string | number | null;
  sortOrder?: string | number | null;
};

function parse(input: RoleInput) {
  const nameEn = requireText(input.nameEn, "nameEn", "Name (English)", 60);
  const slug = toSlug(nameEn);
  if (!slug) {
    throw new ValidationError("nameEn", "Name must contain letters or numbers");
  }

  return {
    slug,
    nameEn,
    nameTa: optionalText(input.nameTa, "nameTa", "Name (Tamil)", 60) ?? "",
    maxPerWard: optionalPositiveInt(input.maxPerWard, "maxPerWard", "Maximum per ward"),
    sortOrder: optionalPositiveInt(input.sortOrder, "sortOrder", "Order") ?? 100,
  };
}

export async function createRole(input: RoleInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const values = parse(input);

    const db = getDb();
    const [row] = await db
      .insert(roles)
      .values({ ...values, isSystem: false })
      .returning({ id: roles.id });

    revalidatePath("/", "layout");
    return { ok: true, data: { id: row.id } };
  } catch (err) {
    return toFailure(err);
  }
}

/** Renaming is always allowed — including for seeded roles, so wording can match the party's */
export async function updateRole(id: string, input: RoleInput): Promise<ActionResult> {
  try {
    await requireAdmin();
    const roleId = requireUuid(id, "id", "Role");
    const values = parse(input);

    const db = getDb();
    const [existing] = await db
      .select({ isSystem: roles.isSystem, slug: roles.slug })
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (!existing) return toFailure(new Error("Role not found"));

    if (values.maxPerWard !== null) {
      const perWard = await db
        .select({ held: sql<number>`count(*)::int` })
        .from(members)
        .where(eq(members.roleId, roleId))
        .groupBy(members.wardId);

      const worst = perWard.reduce((max, row) => Math.max(max, row.held), 0);

      if (worst > values.maxPerWard) {
        throw new ValidationError(
          "maxPerWard",
          `A ward already has ${worst} people in this role. Move them before lowering the limit.`
        );
      }
    }

    await db
      .update(roles)
      .set({
        // A seeded role keeps its slug so queries that look it up keep working.
        slug: existing.isSystem ? existing.slug : values.slug,
        nameEn: values.nameEn,
        nameTa: values.nameTa,
        maxPerWard: values.maxPerWard,
        sortOrder: values.sortOrder,
      })
      .where(eq(roles.id, roleId));

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}

export async function deleteRole(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const roleId = requireUuid(id, "id", "Role");
    const db = getDb();

    const [existing] = await db
      .select({ isSystem: roles.isSystem, nameEn: roles.nameEn })
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (!existing) return toFailure(new Error("Role not found"));
    if (existing.isSystem) {
      throw new ValidationError("id", `"${existing.nameEn}" is a built-in role and cannot be deleted`);
    }

    const [{ used }] = await db
      .select({ used: sql<number>`count(*)::int` })
      .from(members)
      .where(eq(members.roleId, roleId));

    if (used > 0) {
      throw new ValidationError(
        "id",
        `${used} member(s) still hold this role. Move them to another role first.`
      );
    }

    await db.delete(roles).where(eq(roles.id, roleId));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}
