"use client";

import { useState } from "react";
import { resolveMapLink } from "@/server/location-actions";
import {
  formatCoordinates,
  mapLink,
  parseCoordinates,
  type Coordinates,
} from "@/lib/location";
import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * Pins a place on the map.
 *
 * Two ways in, because both happen: a worker standing at the spot taps Use my
 * location, and someone back at the office pastes the link a resident sent on
 * WhatsApp. There is no map drawn here — a pin plus a Directions button is what
 * actually gets someone to the door, and it needs no tiles, no key and no data.
 */
export function LocationField({
  dict,
  value,
  onChange,
  error,
}: {
  dict: Dictionary;
  value: Coordinates | null;
  onChange: (value: Coordinates | null) => void;
  error?: string;
}) {
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const [showPaste, setShowPaste] = useState(false);

  function useMyLocation() {
    setLocalError("");

    if (!navigator.geolocation) {
      setLocalError(dict.location.noGeolocation);
      return;
    }

    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBusy(false);
        onChange({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
      },
      () => {
        setBusy(false);
        setLocalError(dict.location.permissionDenied);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function handlePaste() {
    setLocalError("");

    // Anything carrying the numbers is read here and needs no round trip.
    const direct = parseCoordinates(paste);
    if (direct) {
      onChange(direct);
      setPaste("");
      setShowPaste(false);
      return;
    }

    setBusy(true);
    resolveMapLink(paste)
      .then((result) => {
        if (!result.ok) {
          setLocalError(result.error);
          return;
        }
        onChange(result.data);
        setPaste("");
        setShowPaste(false);
      })
      .catch(() => setLocalError(dict.location.linkFailed))
      .finally(() => setBusy(false));
  }

  const message = error || localError;

  return (
    <div>
      <p className="field-label">{dict.location.mapLocation}</p>

      {value ? (
        <div className="rounded-xl border border-border bg-yellow-soft/40 p-3">
          <p className="text-sm font-medium text-foreground">{dict.location.pinned}</p>
          <p className="mt-0.5 font-mono text-xs text-muted">{formatCoordinates(value)}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
            <a
              href={mapLink(value)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-maroon"
            >
              {dict.location.viewOnMap}
            </a>
            <button type="button" className="text-maroon" onClick={useMyLocation} disabled={busy}>
              {busy ? dict.location.locating : dict.location.updatePin}
            </button>
            <button type="button" className="text-danger" onClick={() => onChange(null)}>
              {dict.location.removePin}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={useMyLocation}
            disabled={busy}
          >
            {busy ? dict.location.locating : dict.location.useMyLocation}
          </button>

          {!showPaste ? (
            <button
              type="button"
              className="text-sm font-medium text-maroon"
              onClick={() => setShowPaste(true)}
            >
              {dict.location.pasteInstead}
            </button>
          ) : (
            <div className="space-y-2">
              <input
                className="field"
                inputMode="url"
                placeholder={dict.location.pastePlaceholder}
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={handlePaste}
                  disabled={busy || !paste.trim()}
                >
                  {busy ? dict.common.loading : dict.location.usePastedLink}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowPaste(false);
                    setPaste("");
                    setLocalError("");
                  }}
                >
                  {dict.common.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="field-hint">{dict.location.hint}</p>
      {message && <p className="field-error">{message}</p>}
    </div>
  );
}
