import { get } from "@vercel/blob";
import { getSession } from "@/lib/auth/guard";
import { isPhotoFolder } from "@/lib/storage/photos";

/**
 * Serves a photo out of the private blob store.
 *
 * The store is private so that a member's photograph, or a picture of someone's
 * property attached to a petition, is not left on a permanently public URL. That
 * means the app has to hand the bytes over itself, behind the same sign-in as
 * everything else.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getSession();
  if (!session) return new Response("Not signed in", { status: 401 });

  const { path } = await params;
  const [folder, ...rest] = path;

  // Only the folders this app writes to, and only a plain file beneath one.
  if (!isPhotoFolder(folder) || rest.length !== 1 || rest[0].includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const pathname = `${folder}/${rest[0]}`;

  try {
    const result = await get(pathname, {
      access: "private",
      // Let the browser revalidate with its stored ETag instead of refetching.
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    });

    if (!result) return new Response("Not found", { status: 404 });

    if (result.statusCode === 304) {
      return new Response(null, {
        status: 304,
        headers: { ETag: result.blob.etag },
      });
    }

    return new Response(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Content-Length": String(result.blob.size),
        ETag: result.blob.etag,
        // Private: the file is per-viewer authorised, so no shared cache may keep it.
        // Immutable because each upload gets its own name.
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[photo]", pathname, err);
    return new Response("Not found", { status: 404 });
  }
}
