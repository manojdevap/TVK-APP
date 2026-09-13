export type Coordinates = { latitude: number; longitude: number };

/** Roughly a metre. More decimals than this is false precision from a phone GPS. */
const PLACES = 6;

export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    // 0,0 is in the Atlantic. It is what a broken GPS reading looks like, never a
    // place in Guduvancheri.
    !(latitude === 0 && longitude === 0)
  );
}

export function roundCoordinate(value: number): number {
  return Number(value.toFixed(PLACES));
}

/**
 * Pulls coordinates out of whatever someone pasted.
 *
 * People share places from the Google Maps app, so the text arriving here is a
 * link far more often than a pair of numbers. These are the shapes that carry the
 * coordinates in the link itself; a maps.app.goo.gl short link carries nothing
 * until it is followed, which the server does instead.
 */
export function parseCoordinates(input: string): Coordinates | null {
  const text = (input ?? "").trim();
  if (!text) return null;

  const patterns = [
    // "13.0827, 80.2707" typed or copied from the Maps "copy coordinates" menu
    /^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/,
    // .../@13.0827,80.2707,17z
    /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,
    // ?q=13.0827,80.2707 — also query=, ll=, daddr=, sll=
    /[?&](?:q|query|ll|sll|daddr|destination)=(-?\d{1,3}(?:\.\d+)?)(?:,|%2C)(-?\d{1,3}(?:\.\d+)?)/i,
    // !3d13.0827!4d80.2707, the place's own pin inside a long Maps URL
    /!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (isValidCoordinates(latitude, longitude)) {
      return { latitude: roundCoordinate(latitude), longitude: roundCoordinate(longitude) };
    }
  }

  return null;
}

/** Short links carry no coordinates until followed — see resolveMapLink */
export function isShortMapLink(input: string): boolean {
  return /^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test((input ?? "").trim());
}

/**
 * A link that opens the pin in whatever map app the phone has.
 *
 * geo: would be the native way to do it, but it does nothing on a desktop browser
 * and nothing in some in-app browsers, so this stays with a plain https link that
 * every phone hands to its map app anyway.
 */
export function mapLink({ latitude, longitude }: Coordinates): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function directionsLink({ latitude, longitude }: Coordinates): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export function formatCoordinates({ latitude, longitude }: Coordinates): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

/**
 * Both columns are set together or neither is — half a pin is not a place.
 */
export function coordinatesOf(row: {
  latitude: number | null;
  longitude: number | null;
}): Coordinates | null {
  if (row.latitude === null || row.longitude === null) return null;
  if (!isValidCoordinates(row.latitude, row.longitude)) return null;
  return { latitude: row.latitude, longitude: row.longitude };
}
