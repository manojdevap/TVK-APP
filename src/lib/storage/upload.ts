import { allowedImageTypes, maxUploadBytes, type StorageBucket } from "@/config/storage";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function storageClient() {
  if (hasServiceRole()) return createServiceClient();
  return createClient();
}

export function validateImageFile(file: File) {
  if (!allowedImageTypes.includes(file.type as (typeof allowedImageTypes)[number])) {
    throw new Error("Only JPEG, PNG, WebP, or GIF images are allowed");
  }
  if (file.size > maxUploadBytes) {
    throw new Error("Image must be under 5 MB");
  }
}

/** Upload image to Supabase Storage and return public URL */
export async function uploadImage(
  bucket: StorageBucket,
  file: File,
  folder: string
): Promise<string> {
  validateImageFile(file);

  const supabase = await storageClient();
  const safeName = file.name.replace(/[^\w.-]/g, "_");
  const path = `${folder}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Delete image from storage by public URL (best-effort) */
export async function deleteImageByUrl(bucket: StorageBucket, publicUrl: string) {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;

  const path = publicUrl.slice(idx + marker.length);
  const supabase = await storageClient();
  await supabase.storage.from(bucket).remove([path]);
}
