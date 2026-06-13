"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { FilterBar, RoleFilter, WardFilter } from "@/components/filters/ListFilters";
import { UserAvatar } from "@/components/ui/MediaDisplay";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { User, Ward } from "@/types";

export function UsersTable({
  users,
  wards,
  dict,
}: {
  users: User[];
  wards: Ward[];
  dict: Dictionary;
}) {
  const [wardFilter, setWardFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const wardOptions = wards.map((w) => ({
    id: w.id,
    label: `${dict.common.ward} ${w.number} — ${w.name}`,
  }));

  const roleOptions = (["ward_head", "ward_organiser", "ward_member", "admin"] as const).map(
    (role) => ({
      value: role,
      label: dict.roles[role],
    })
  );

  const filtered = useMemo(() => {
    return users.filter((user) => {
      if (wardFilter && user.wardId !== wardFilter) return false;
      if (roleFilter && user.role !== roleFilter) return false;
      return true;
    });
  }, [users, wardFilter, roleFilter]);

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
        <RoleFilter
          value={roleFilter}
          onChange={setRoleFilter}
          roles={roleOptions}
          allLabel={dict.common.allRoles}
          label={dict.common.filterByRole}
        />
        <p className="ml-auto text-sm text-muted">
          {filtered.length} / {users.length}
        </p>
      </FilterBar>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{dict.users.name}</th>
              <th>{dict.users.photo}</th>
              <th>{dict.users.role}</th>
              <th>{dict.users.ward}</th>
              <th>{dict.users.voterId}</th>
              <th>{dict.users.gender}</th>
              <th>{dict.users.ourVote}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const ward = wards.find((w) => w.id === user.wardId);
              return (
                <tr key={user.id}>
                  <td>
                    <p className="font-medium text-foreground">{user.username}</p>
                    <p className="text-xs text-muted">{user.address}</p>
                  </td>
                  <td>
                    <UserAvatar name={user.username} avatarUrl={user.avatarUrl} size={36} />
                  </td>
                  <td>{dict.roles[user.role]}</td>
                  <td className="max-w-[140px] truncate">{ward?.name ?? "—"}</td>
                  <td className="font-mono text-xs">{user.voterId}</td>
                  <td>{user.gender === "male" ? dict.common.male : dict.common.female}</td>
                  <td>
                    {user.isOurVote ? (
                      <Badge variant="success">{dict.common.yes}</Badge>
                    ) : (
                      <Badge>{dict.common.no}</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
