import "server-only";
import { del, put } from "@vercel/blob";

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const PHOTO_FOLDERS = ["members", "events", "petitions"] as const;
export type PhotoFolder = (typeof PHOTO_FOLDERS)[number];

export class PhotoError extends Error {}

export function isPhotoFolder(value: unknown): value is PhotoFolder {
  return typeof value === "string" && PHOTO_FOLDERS.includes(value as PhotoFolder);
}

/**
 * Vercel Blob accepts either a static read/write token or, on a deployment, the
 * short-lived OIDC credential paired with the store id.
 *
 * Connecting a store to a project provisions `BLOB_STORE_ID` and leaves the OIDC
 * token to the runtime — it does not create a static token — so checking only for
 * `BLOB_READ_WRITE_TOKEN` rejects a perfectly well configured deployment.
 */
function hasBlobStore() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true;

  return Boolean(
    process.env.BLOB_STORE_ID && (process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL)
  );
}

function assertUsable(file: File) {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_TYPES)[number])) {
    throw new PhotoError("Photo must be a JPEG, PNG or WebP image");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new PhotoError("Photo must be under 2 MB");
  }
  if (file.size === 0) {
    throw new PhotoError("That file is empty");
  }
}

/**
 * Photos live in Vercel Blob, because a serverless filesystem does not survive the
 * request that wrote to it.
 *
 * In development, where there is a real disk and usually no blob token, files go to
 * public/uploads instead. Production never takes that path — it fails loudly rather
 * than writing somewhere that silently disappears.
 */
export async function savePhoto(file: File, folder: PhotoFolder): Promise<string> {
  assertUsable(file);

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const name = `${folder}/${crypto.randomUUID()}.${extension}`;

  if (hasBlobStore()) {
    const blob = await put(name, file, {
      access: "public",
      contentType: file.type,
      // Photos are immutable: a change writes a new name, so they cache forever.
      cacheControlMaxAge: 31536000,
    });
    return blob.url;
  }

  if (process.env.NODE_ENV === "production") {
    throw new PhotoError(
      "Photo storage is not configured. Connect a Vercel Blob store to this project, " +
        "or set BLOB_READ_WRITE_TOKEN, then redeploy."
    );
  }

  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const absolute = path.join(process.cwd(), "public", "uploads", name);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, Buffer.from(await file.arrayBuffer()));

  return `/uploads/${name}`;
}

/** Best effort — a member edit must not fail because an old photo could not be removed */
export async function deletePhoto(url: string | null | undefined): Promise<void> {
  if (!url) return;

  try {
    if (url.startsWith("http")) {
      if (hasBlobStore()) await del(url);
      return;
    }

    if (!url.startsWith("/uploads/") || url.includes("..")) return;

    const { unlink } = await import("node:fs/promises");
    const path = await import("node:path");
    const uploadsRoot = path.join(process.cwd(), "public", "uploads");
    const absolute = path.resolve(process.cwd(), "public", url.replace(/^\//, ""));
    if (!absolute.startsWith(uploadsRoot)) return;

    await unlink(absolute);
  } catch (err) {
    console.error("[photo delete]", err);
  }
}
