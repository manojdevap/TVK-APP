"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { FilterBar, WardFilter } from "@/components/filters/ListFilters";
import { PhotoGrid } from "@/components/ui/MediaDisplay";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";
import type { Event, User, Ward } from "@/types";

const statusVariant: Record<string, "info" | "success" | "warning" | "danger"> = {
  planned: "info",
  ongoing: "warning",
  completed: "success",
  cancelled: "danger",
};

export function EventsList({
  events,
  wards,
  users,
  locale,
  dict,
}: {
  events: Event[];
  wards: Ward[];
  users: User[];
  locale: Locale;
  dict: Dictionary;
}) {
  const [wardFilter, setWardFilter] = useState("");

  const wardOptions = wards.map((w) => ({
    id: w.id,
    label: `${dict.common.ward} ${w.number} — ${w.name}`,
  }));

  const filtered = useMemo(
    () => events.filter((e) => !wardFilter || e.wardId === wardFilter),
    [events, wardFilter]
  );

  return (
    <>
      <FilterBar>
        <WardFilter
          value={wardFilter}
          onChange={setWardFilter}
          wards={wardOptions}
          allLabel={dict.common.allWards}
          label={dict.common.filterByWard}
        />
        <p className="ml-auto text-sm text-muted">
          {filtered.length} / {events.length}
        </p>
      </FilterBar>

      <div className="grid gap-4">
        {filtered.map((event) => {
          const ward = wards.find((w) => w.id === event.wardId);
          const organiser = users.find((u) => u.id === event.organiserId);

          return (
            <Link key={event.id} href={`/${locale}/events/${event.id}`} className="card-hover block">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-foreground">{event.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{event.description}</p>
                  <PhotoGrid photos={event.photos.slice(0, 3)} alt={event.title} />
                </div>
                <Badge variant={statusVariant[event.status]}>
                  {dict.eventStatus[event.status]}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                <span>{event.date}</span>
                <span>{event.location}</span>
                <span>{ward?.name}</span>
                {organiser && (
                  <span>
                    {dict.events.organiser}: {organiser.username}
                  </span>
                )}
                <span>
                  {event.participantIds.length} {dict.common.participants} ·{" "}
                  {event.invitedIds.length} {dict.common.invited}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
