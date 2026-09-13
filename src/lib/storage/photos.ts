import "server-only";
import { del, put } from "@vercel/blob";
import { ConfigError } from "@/lib/config-error";

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const PHOTO_FOLDERS = ["members", "events", "petitions"] as const;
export type PhotoFolder = (typeof PHOTO_FOLDERS)[number];

/** Where the app serves stored photos from — see app/api/photos/[...path] */
const PROXY_PREFIX = "/api/photos/";
const LOCAL_PREFIX = "/uploads/";

export class PhotoError extends Error {}

export function isPhotoFolder(value: unknown): value is PhotoFolder {
  return typeof value === "string" && PHOTO_FOLDERS.includes(value as PhotoFolder);
}

/**
 * Vercel Blob accepts either a static read/write token or, on a deployment, the
 * short-lived OIDC credential paired with the store id.
 *
 * Connecting a store to a project provisions `BLOB_STORE_ID` and leaves
 * authentication to the OIDC token — it does not create a static token.
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
 * A URL this app issued, for the folder it claims to belong to.
 *
 * Both shapes are app-relative paths, so nothing the browser sends can point the
 * app at someone else's host.
 */
export function isAppPhotoUrl(url: string, folder: PhotoFolder): boolean {
  const suffix = `${folder}/`;
  if (url.includes("..")) return false;

  return (
    (url.startsWith(PROXY_PREFIX + suffix) || url.startsWith(LOCAL_PREFIX + suffix)) &&
    url.length > (PROXY_PREFIX + suffix).length
  );
}

/** "/api/photos/events/abc.jpg" -> "events/abc.jpg" */
export function blobPathnameFromUrl(url: string): string | null {
  if (!url.startsWith(PROXY_PREFIX) || url.includes("..")) return null;
  const pathname = url.slice(PROXY_PREFIX.length);
  return pathname || null;
}

/**
 * Photos live in Vercel Blob, because a serverless filesystem does not survive the
 * request that wrote to it.
 *
 * They are stored with private access and served back through the app, so a photo of
 * a member or of someone's property is readable only by a signed-in user — a public
 * blob URL would stay viewable by anyone holding the link, forever.
 *
 * In development, where there is a real disk and usually no blob store, files go to
 * public/uploads instead. Production never takes that path.
 */
export async function savePhoto(file: File, folder: PhotoFolder): Promise<string> {
  assertUsable(file);

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const name = `${folder}/${crypto.randomUUID()}.${extension}`;

  if (hasBlobStore()) {
    await put(name, file, {
      access: "private",
      contentType: file.type,
      // The name is unique per upload, so the bytes behind it never change.
      cacheControlMaxAge: 31536000,
    });
    return PROXY_PREFIX + name;
  }

  if (process.env.NODE_ENV === "production") {
    throw new ConfigError(
      "Photo storage is not configured. Connect a Vercel Blob store to this project, or set BLOB_READ_WRITE_TOKEN."
    );
  }

  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const absolute = path.join(process.cwd(), "public", "uploads", name);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, Buffer.from(await file.arrayBuffer()));

  return LOCAL_PREFIX + name;
}

/** Best effort — an edit must not fail because an old photo could not be removed */
export async function deletePhoto(url: string | null | undefined): Promise<void> {
  if (!url) return;

  try {
    const pathname = blobPathnameFromUrl(url);
    if (pathname) {
      if (hasBlobStore()) await del(pathname);
      return;
    }

    if (!url.startsWith(LOCAL_PREFIX) || url.includes("..")) return;

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
