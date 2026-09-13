"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setPetitionStatus } from "@/server/petition-actions";
import { ErrorNote } from "@/components/ui/Empty";
import type { PetitionStatus } from "@/db/schema";
import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * Moving a petition along without opening the whole form — the common action on this
 * screen is "this is being looked at now" or "this is done", not editing the details.
 */
const NEXT: Record<PetitionStatus, PetitionStatus[]> = {
  submitted: ["in_progress", "resolved", "rejected"],
  in_progress: ["resolved", "rejected"],
  resolved: ["in_progress"],
  rejected: ["in_progress"],
};

export function StatusActions({
  petitionId,
  status,
  dict,
}: {
  petitionId: string;
  status: PetitionStatus;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<PetitionStatus | null>(null);
  const [error, setError] = useState("");

  async function move(next: PetitionStatus) {
    setBusy(next);
    setError("");

    const result = await setPetitionStatus(petitionId, next);
    setBusy(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const options = NEXT[status];
  if (!options.length) return null;

  return (
    <div className="space-y-2">
      <p className="section-title">{dict.petitions.moveTo}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((next) => (
          <button
            key={next}
            type="button"
            className="btn-secondary flex-1"
            disabled={busy !== null}
            onClick={() => move(next)}
          >
            {busy === next ? dict.common.saving : dict.petitionStatus[next]}
          </button>
        ))}
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
    </div>
  );
}
