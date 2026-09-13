"use server";

import { requireAdmin } from "@/lib/auth/guard";
import { isShortMapLink, parseCoordinates, type Coordinates } from "@/lib/location";
import { failure, toFailure, type ActionResult } from "./action-result";

/** Only these hosts are ever fetched — the input is a link a person pasted */
const SHORT_LINK_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);
const MAX_HOPS = 3;

/**
 * Turns a shared Google Maps link into coordinates.
 *
 * Sharing a place from the Maps app on a phone produces a maps.app.goo.gl link,
 * which carries no coordinates at all until it is followed. The browser cannot
 * follow it — another origin will not allow the read — so the server does, one
 * redirect at a time, and never leaves the two hosts above.
 */
export async function resolveMapLink(input: string): Promise<ActionResult<Coordinates>> {
  try {
    await requireAdmin();

    const text = (input ?? "").trim();
    if (!text) return failure("Paste a map link first");

    // Anything that already carries the numbers needs no request at all.
    const direct = parseCoordinates(text);
    if (direct) return { ok: true, data: direct };

    if (!isShortMapLink(text)) {
      return failure("That does not look like a Google Maps link");
    }

    let url = text;

    for (let hop = 0; hop < MAX_HOPS; hop++) {
      const host = new URL(url).hostname.toLowerCase();
      if (!SHORT_LINK_HOSTS.has(host)) return failure("That link goes somewhere unexpected");

      const response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
        headers: {
          // Google serves a page without the coordinates to clients it does not know.
          "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile",
        },
      });

      const next = response.headers.get("location");
      if (!next) break;

      const found = parseCoordinates(next);
      if (found) return { ok: true, data: found };

      // A short link usually lands on a full maps.google.com URL, which is not a
      // host worth another request — the coordinates are in the address itself.
      url = new URL(next, url).toString();
      if (!SHORT_LINK_HOSTS.has(new URL(url).hostname.toLowerCase())) break;
    }

    const last = parseCoordinates(url);
    if (last) return { ok: true, data: last };

    return failure("Could not read a place from that link. Try Use my location instead.");
  } catch (err) {
    return toFailure(err);
  }
}
