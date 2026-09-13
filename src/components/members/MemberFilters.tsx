"use client";

import { useRouter, useSearchParams } from "next/navigation";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

type Option = { id: string; label: string };

/**
 * Filters live in the URL so the server can do the searching and paging. That keeps
 * the whole roster on the server — only one page of members is ever sent to a phone.
 */
export function MemberFilters({
  locale,
  dict,
  wards,
  roles,
}: {
  locale: Locale;
  dict: Dictionary;
  wards: Option[];
  roles: Option[];
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
    // Any change to the filters starts again from the first page.
    search.delete("page");
    router.replace(`/${locale}/members?${search.toString()}`);
  }

  return (
    <div className="space-y-2">
      {/* Uncontrolled, keyed on the URL: going back re-mounts it with the right text,
          so there is no state to keep in step with the address bar. */}
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
          placeholder={dict.members.searchPlaceholder}
          defaultValue={currentQuery}
        />
        <button type="submit" className="btn-secondary shrink-0">
          {dict.common.search}
        </button>
      </form>

      <div className="flex gap-2">
        <select
          className="field"
          aria-label={dict.members.filterWard}
          value={params.get("ward") ?? ""}
          onChange={(e) => apply({ ward: e.target.value })}
        >
          <option value="">{dict.members.allWards}</option>
          {wards.map((ward) => (
            <option key={ward.id} value={ward.id}>
              {ward.label}
            </option>
          ))}
        </select>

        <select
          className="field"
          aria-label={dict.members.filterRole}
          value={params.get("role") ?? ""}
          onChange={(e) => apply({ role: e.target.value })}
        >
          <option value="">{dict.members.allRoles}</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
