"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { PetitionStatus } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

const STATUSES: PetitionStatus[] = ["submitted", "in_progress", "resolved", "rejected"];

export function PetitionFilters({
  locale,
  dict,
  wards,
}: {
  locale: Locale;
  dict: Dictionary;
  wards: { id: string; label: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const currentQuery = params.get("q") ?? "";
  const currentStatus = params.get("status") ?? "";

  function apply(next: Record<string, string>) {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    search.delete("page");
    router.replace(`/${locale}/petitions?${search.toString()}`);
  }

  return (
    <div className="space-y-2">
      {/* Uncontrolled and keyed on the URL, so going back restores the right text */}
      <form
        key={currentQuery}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          apply({ q: String(data.get("q") ?? "").trim() });
        }}
        role="search"
        className="flex gap-2"
      >
        <input
          name="q"
          className="field"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          aria-label={dict.common.search}
          placeholder={dict.petitions.searchPlaceholder}
          defaultValue={currentQuery}
        />
        <button type="submit" className="btn-secondary shrink-0">
          {dict.common.search}
        </button>
      </form>

      {/* Status is filtered most often, so it gets buttons rather than a menu. They
          wrap onto a second line — a sideways scroller hides options off-screen. */}
      <div className="flex flex-wrap gap-1.5">
        <FilterPill active={!currentStatus} onClick={() => apply({ status: "" })}>
          {dict.petitions.allStatuses}
        </FilterPill>
        {STATUSES.map((status) => (
          <FilterPill
            key={status}
            active={currentStatus === status}
            onClick={() => apply({ status })}
          >
            {dict.petitionStatus[status]}
          </FilterPill>
        ))}
      </div>

      <select
        className="field"
        aria-label={dict.petitions.ward}
        value={params.get("ward") ?? ""}
        onChange={(e) => apply({ ward: e.target.value })}
      >
        <option value="">{dict.members.allWards}</option>
        <option value="municipality">{dict.petitions.municipalityWide}</option>
        {wards.map((ward) => (
          <option key={ward.id} value={ward.id}>
            {ward.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-9 shrink-0 rounded-full border px-3 text-sm font-medium transition ${
        active
          ? "border-maroon bg-maroon text-yellow"
          : "border-border bg-surface text-muted"
      }`}
    >
      {children}
    </button>
  );
}
