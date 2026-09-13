"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadPhoto } from "@/server/photo-actions";
import { shrinkImage } from "@/lib/images";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function PhotoField({
  dict,
  folder,
  value,
  onChange,
  error,
  label,
  hint,
}: {
  dict: Dictionary;
  /** Which bucket the file belongs in — the server re-checks this */
  folder: "members" | "events" | "petitions";
  value: string;
  onChange: (url: string) => void;
  error?: string;
  /** Defaults suit a member portrait; events override them for the banner */
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBusy(true);
    setLocalError("");

    try {
      const data = new FormData();
      data.set("photo", await shrinkImage(file));
      data.set("folder", folder);

      const result = await uploadPhoto(data);
      if (!result.ok) {
        setLocalError(result.error);
        return;
      }
      onChange(result.data.url);
    } catch {
      setLocalError(dict.members.photoFailed);
    } finally {
      setBusy(false);
    }
  }

  const message = error || localError;

  return (
    <div>
      <span className="field-label">
        {label ?? dict.members.photo}{" "}
        <span className="font-normal text-muted">({dict.common.optional})</span>
      </span>

      <div className="mt-1 flex items-center gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-surface-sunk">
          {value ? (
            <Image
              src={value}
              alt=""
              width={80}
              height={80}
              className="h-20 w-20 object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl text-muted">
              ○
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? dict.members.photoUploading : value ? dict.members.photoReplace : dict.members.photoAdd}
          </button>

          {value && !busy && (
            <button
              type="button"
              className="text-sm font-medium text-danger"
              onClick={() => onChange("")}
            >
              {dict.members.photoRemove}
            </button>
          )}
        </div>
      </div>

      {/* capture hints phones to offer the camera first, while still allowing the gallery */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {message ? (
        <p className="field-error">{message}</p>
      ) : (
        <p className="field-hint">{hint ?? dict.members.photoHint}</p>
      )}
    </div>
  );
}
