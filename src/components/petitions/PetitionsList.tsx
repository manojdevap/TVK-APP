"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { FilterBar, WardFilter } from "@/components/filters/ListFilters";
import { PhotoGrid } from "@/components/ui/MediaDisplay";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Petition, User, Ward } from "@/types";

const statusVariant: Record<string, "success" | "warning" | "danger" | "info"> = {
  submitted: "info",
  in_progress: "warning",
  resolved: "success",
  rejected: "danger",
};

export function PetitionsList({
  petitions,
  wards,
  users,
  dict,
}: {
  petitions: Petition[];
  wards: Ward[];
  users: User[];
  dict: Dictionary;
}) {
  const [wardFilter, setWardFilter] = useState("");

  const wardOptions = wards.map((w) => ({
    id: w.id,
    label: `${dict.common.ward} ${w.number} — ${w.name}`,
  }));

  const filtered = useMemo(
    () => petitions.filter((p) => !wardFilter || p.wardId === wardFilter),
    [petitions, wardFilter]
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
          {filtered.length} / {petitions.length}
        </p>
      </FilterBar>

      <div className="grid gap-4">
        {filtered.map((petition) => {
          const ward = wards.find((w) => w.id === petition.wardId);
          const petitioner = users.find((u) => u.id === petition.petitionerId);

          return (
            <Card key={petition.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-foreground">{petition.title}</h2>
                  <p className="mt-1 text-sm text-muted">{petition.description}</p>
                  <PhotoGrid photos={petition.photos} alt={petition.title} />
                </div>
                <Badge variant={statusVariant[petition.status]}>
                  {dict.petitionStatus[petition.status]}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <Badge variant="info">{dict.departments[petition.department]}</Badge>
                {ward && <span className="text-muted">{ward.name}</span>}
                {petitioner && (
                  <span className="text-muted">
                    {dict.petitions.petitioner}: {petitioner.username}
                  </span>
                )}
                <span className="text-muted/80">
                  {dict.petitions.submitted} {petition.submittedAt}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
