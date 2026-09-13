const MAX_EDGE = 640;
const QUALITY = 0.82;

/**
 * Shrinks a picture in the browser before it is uploaded.
 *
 * A phone camera produces several megabytes; over a ward-level mobile connection that
 * is a long wait and, on a metered plan, real money. A 640px JPEG is ample for a
 * contact photo or a gallery thumbnail and lands in tens of kilobytes.
 *
 * Anything that cannot be decoded here — HEIC on some browsers — is returned
 * untouched and left for the server to accept or reject.
 */
export async function shrinkImage(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    );
    if (!blob) return file;

    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
