"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function EventFilters({
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

  function apply(next: Record<string, string>) {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    search.delete("page");
    router.replace(`/${locale}/events?${search.toString()}`);
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
          placeholder={dict.events.searchPlaceholder}
          defaultValue={currentQuery}
        />
        <button type="submit" className="btn-secondary shrink-0">
          {dict.common.search}
        </button>
      </form>

      <select
        className="field"
        aria-label={dict.events.ward}
        value={params.get("ward") ?? ""}
        onChange={(e) => apply({ ward: e.target.value })}
      >
        <option value="">{dict.members.allWards}</option>
        <option value="party">{dict.events.partyWide}</option>
        {wards.map((ward) => (
          <option key={ward.id} value={ward.id}>
            {ward.label}
          </option>
        ))}
      </select>
    </div>
  );
}
