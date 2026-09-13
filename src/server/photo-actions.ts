"use server";

import { requireAdmin } from "@/lib/auth/guard";
import { isPhotoFolder, PhotoError, savePhoto } from "@/lib/storage/photos";
import { failure, toFailure, type ActionResult } from "./action-result";

/**
 * Uploads a photo and hands back its URL. The URL is then saved with the record like
 * any other field, so a half-filled form never writes a partial row.
 *
 * The folder comes from the browser, so it is checked against a fixed list rather
 * than trusted — otherwise a caller could choose where files land.
 */
export async function uploadPhoto(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    await requireAdmin();

    const file = formData.get("photo");
    if (!(file instanceof File)) return failure("No photo was selected", "photoUrl");

    const folder = formData.get("folder");
    if (!isPhotoFolder(folder)) return failure("That photo could not be saved", "photoUrl");

    const url = await savePhoto(file, folder);
    return { ok: true, data: { url } };
  } catch (err) {
    if (err instanceof PhotoError) return failure(err.message, "photoUrl");
    return toFailure(err);
  }
}
