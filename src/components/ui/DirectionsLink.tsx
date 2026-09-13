import { directionsLink, formatCoordinates, type Coordinates } from "@/lib/location";
import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * The point of storing a pin: one tap to navigation.
 *
 * Rendered on the server, because it is a plain link — a phone hands it to the map
 * app it already has, and a desktop opens it in a tab.
 */
export function DirectionsLink({
  dict,
  coordinates,
  place,
}: {
  dict: Dictionary;
  coordinates: Coordinates;
  /** The venue or address the pin belongs to, shown above the button */
  place?: string | null;
}) {
  return (
    <a
      href={directionsLink(coordinates)}
      target="_blank"
      rel="noopener noreferrer"
      className="tap-row card justify-between"
    >
      <span className="min-w-0">
        <span className="block font-medium text-foreground">{dict.location.directions}</span>
        <span className="block truncate text-xs text-muted">
          {place || formatCoordinates(coordinates)}
        </span>
      </span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 shrink-0 text-maroon"
        aria-hidden="true"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    </a>
  );
}
