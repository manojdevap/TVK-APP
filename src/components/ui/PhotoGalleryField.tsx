"use client";

import { useRef, useState } from "react";
import { uploadPhoto } from "@/server/photo-actions";
import { shrinkImage } from "@/lib/images";
import type { Dictionary } from "@/i18n/dictionaries/en";

const MAX_PHOTOS = 30;

/**
 * The event gallery: several photos, uploaded as they are chosen.
 *
 * Each one is shrunk in the browser first, and they upload one after another rather
 * than all at once — a handful of camera photos over a ward-level connection would
 * otherwise compete for the same bandwidth and all finish late.
 */
export function PhotoGalleryField({
  dict,
  folder,
  value,
  onChange,
  error,
  label,
  hint,
  max = MAX_PHOTOS,
}: {
  dict: Dictionary;
  /** Which bucket the files belong in — the server re-checks this */
  folder: "events" | "petitions";
  value: string[];
  onChange: (urls: string[]) => void;
  error?: string;
  label?: string;
  hint?: string;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [localError, setLocalError] = useState("");

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    const room = max - value.length;
    if (room <= 0) {
      setLocalError(dict.events.galleryFull);
      return;
    }

    const batch = files.slice(0, room);
    setLocalError(batch.length < files.length ? dict.events.galleryFull : "");
    setProgress({ done: 0, total: batch.length });

    const added: string[] = [];
    try {
      for (const [index, file] of batch.entries()) {
        const data = new FormData();
        data.set("photo", await shrinkImage(file));
        data.set("folder", folder);

        const result = await uploadPhoto(data);
        if (!result.ok) {
          setLocalError(result.error);
          break;
        }
        added.push(result.data.url);
        setProgress({ done: index + 1, total: batch.length });
      }
    } finally {
      setProgress(null);
      // Keep whatever succeeded, even if a later one failed.
      if (added.length) onChange([...value, ...added]);
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  const message = error || localError;

  return (
    <div>
      <span className="field-label">
        {label ?? dict.events.gallery}{" "}
        <span className="font-normal text-muted">({dict.common.optional})</span>
      </span>

      {value.length > 0 && (
        <ul className="mt-2 grid grid-cols-3 gap-2">
          {value.map((url, index) => (
            <li key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="aspect-square w-full rounded-xl border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label={dict.events.galleryRemove}
                className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-danger text-sm font-bold text-white shadow"
              >
                ×
              </button>
              <div className="absolute inset-x-1 bottom-1 flex justify-between">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={dict.events.galleryMoveEarlier}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white disabled:opacity-0"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                  aria-label={dict.events.galleryMoveLater}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white disabled:opacity-0"
                >
                  ›
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="btn-secondary mt-2 w-full"
        disabled={progress !== null}
        onClick={() => inputRef.current?.click()}
      >
        {progress
          ? `${dict.members.photoUploading} ${progress.done}/${progress.total}`
          : dict.events.galleryAdd}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {message ? (
        <p className="field-error">{message}</p>
      ) : (
        <p className="field-hint">
          {value.length}/{max} · {hint ?? dict.events.galleryHint}
        </p>
      )}
    </div>
  );
}
