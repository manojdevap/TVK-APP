"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { wards } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";
import { optionalText, requireUuid } from "@/lib/validation";
import { toFailure, type ActionResult } from "./action-result";

export type WardInput = {
  nameEn?: string;
  nameTa?: string;
  areaEn?: string;
  areaTa?: string;
};

/**
 * Wards 1..N are a fixed roster seeded once — they are named and described, never
 * created or deleted, so the ward number itself is not editable.
 */
export async function updateWard(id: string, input: WardInput): Promise<ActionResult> {
  try {
    await requireAdmin();
    const wardId = requireUuid(id, "id", "Ward");

    const db = getDb();
    const updated = await db
      .update(wards)
      .set({
        nameEn: optionalText(input.nameEn, "nameEn", "Name (English)", 120) ?? "",
        nameTa: optionalText(input.nameTa, "nameTa", "Name (Tamil)", 120) ?? "",
        areaEn: optionalText(input.areaEn, "areaEn", "Area (English)", 200) ?? "",
        areaTa: optionalText(input.areaTa, "areaTa", "Area (Tamil)", 200) ?? "",
      })
      .where(eq(wards.id, wardId))
      .returning({ id: wards.id });

    if (!updated.length) return toFailure(new Error("Ward not found"));

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}
