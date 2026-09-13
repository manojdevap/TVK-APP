"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateWard, type WardInput } from "@/server/ward-actions";
import { ErrorNote } from "@/components/ui/Empty";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function WardDetailsForm({
  wardId,
  dict,
  ward,
}: {
  wardId: string;
  dict: Dictionary;
  ward: WardInput;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<WardInput>(ward);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const result = await updateWard(wardId, form);
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" className="btn-secondary w-full" onClick={() => setOpen(true)}>
        {dict.wards.editDetails}
      </button>
    );
  }

  const fields = [
    { key: "nameEn", label: dict.wards.nameEn },
    { key: "nameTa", label: dict.wards.nameTa },
    { key: "areaEn", label: dict.wards.areaEn },
    { key: "areaTa", label: dict.wards.areaTa },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {fields.map(({ key, label }) => (
        <div key={key}>
          <label className="field-label" htmlFor={`ward-${key}`}>
            {label}
          </label>
          <input
            id={`ward-${key}`}
            className="field"
            value={form[key] ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
          />
        </div>
      ))}

      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1" disabled={busy}>
          {busy ? dict.common.saving : dict.common.save}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
          {dict.common.cancel}
        </button>
      </div>
    </form>
  );
}
