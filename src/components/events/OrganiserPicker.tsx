"use client";

import { useEffect, useState } from "react";
import { listOrganiserOptions, type OrganiserOption } from "@/server/event-lookups";
import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * Picks the member running an event.
 *
 * With a ward chosen there is a short list to pick from. A party-wide event has no
 * ward to narrow by and the full roster is far too long for a phone, so that case
 * becomes a search: type a name, choose from the matches.
 */
export function OrganiserPicker({
  dict,
  wardId,
  value,
  valueLabel,
  onChange,
  error,
  label,
}: {
  dict: Dictionary;
  /** Empty for a party-wide event */
  wardId: string;
  value: string;
  valueLabel: string;
  onChange: (id: string, label: string) => void;
  error?: string;
  /** Defaults to the event wording; petitions call the same person the handler */
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<OrganiserOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Nothing to look up until there is a ward, or enough of a name to be worth asking.
  const shouldSearch = Boolean(wardId) || query.trim().length >= 2;

  useEffect(() => {
    if (!shouldSearch) return;

    let active = true;

    // Wait for a pause in typing so every keystroke is not a round trip. State is
    // only touched inside these callbacks, never while the effect itself is running.
    const timer = setTimeout(() => {
      if (!active) return;
      setLoading(true);

      listOrganiserOptions({ wardId, query: query.trim() })
        .then((rows) => {
          if (active) setOptions(rows);
        })
        .catch(() => {
          if (active) setOptions([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [wardId, query, shouldSearch]);

  // Derived rather than cleared in the effect, so stale results never flash.
  const visible = shouldSearch ? options : [];

  if (value) {
    return (
      <div>
        <span className="field-label">
          {label ?? dict.events.organisedBy}{" "}
          <span className="font-normal text-muted">({dict.common.optional})</span>
        </span>
        <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
          <span className="min-w-0 truncate font-medium text-foreground">{valueLabel}</span>
          <button
            type="button"
            className="shrink-0 text-sm font-medium text-danger"
            onClick={() => {
              onChange("", "");
              setQuery("");
            }}
          >
            {dict.common.clear}
          </button>
        </div>
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  }

  const prompt = wardId ? dict.events.organiserSearchWard : dict.events.organiserSearchParty;

  return (
    <div>
      <label className="field-label" htmlFor="organiser-search">
        {label ?? dict.events.organisedBy}{" "}
        <span className="font-normal text-muted">({dict.common.optional})</span>
      </label>

      <input
        id="organiser-search"
        className="field mt-1"
        type="search"
        autoComplete="off"
        placeholder={prompt}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && <p className="field-hint">{dict.common.loading}</p>}

      {!loading && visible.length > 0 && (
        <ul className="mt-2 max-h-56 divide-y divide-border overflow-y-auto rounded-xl border border-border bg-surface">
          {visible.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                className="tap-row w-full justify-between"
                onClick={() => onChange(person.id, person.fullName)}
              >
                <span className="min-w-0 truncate">{person.fullName}</span>
                <span className="shrink-0 text-xs text-muted">
                  {dict.wards.ward} {person.wardNumber}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && visible.length === 0 && (
        <p className="field-hint">
          {!wardId && query.trim().length < 2
            ? dict.events.organiserTypeToSearch
            : dict.events.organiserNoMatches}
        </p>
      )}

      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
