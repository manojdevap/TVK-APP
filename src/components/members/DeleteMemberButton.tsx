"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteMember } from "@/server/member-actions";
import { ErrorNote } from "@/components/ui/Empty";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function DeleteMemberButton({
  memberId,
  dict,
  redirectTo,
}: {
  memberId: string;
  dict: Dictionary;
  redirectTo: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (!confirm(dict.members.confirmDelete)) return;

    setBusy(true);
    setError("");
    const result = await deleteMember(memberId);

    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={handleClick} disabled={busy} className="btn-danger w-full">
        {busy ? dict.common.deleting : dict.common.delete}
      </button>
      {error && <ErrorNote>{error}</ErrorNote>}
    </div>
  );
}
