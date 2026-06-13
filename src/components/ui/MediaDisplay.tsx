import { AppImage } from "@/components/ui/AppImage";

export function UserAvatar({
  name,
  avatarUrl,
  size = 40,
}: {
  name: string;
  avatarUrl?: string;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      <AppImage
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-tvk-yellow/30 font-semibold text-tvk-maroon"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function PhotoGrid({ photos, alt = "" }: { photos: string[]; alt?: string }) {
  if (!photos.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {photos.map((photo) => (
        <div key={photo} className="relative h-20 w-28 overflow-hidden rounded-lg border border-border sm:h-24 sm:w-32">
          <AppImage src={photo} alt={alt} fill className="object-cover" sizes="128px" />
        </div>
      ))}
    </div>
  );
}
