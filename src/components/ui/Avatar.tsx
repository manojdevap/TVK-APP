import Image from "next/image";

/** Photo when there is one, otherwise the member's initial. */
export function Avatar({
  name,
  photoUrl,
  size = 40,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
}) {
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt=""
        width={size}
        height={size}
        // Blob and local upload URLs are already sized for display, and the optimiser
        // cannot reach an arbitrary blob host without extra configuration.
        unoptimized
        className="shrink-0 rounded-full border border-border object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-yellow-soft font-semibold text-maroon-dark"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
