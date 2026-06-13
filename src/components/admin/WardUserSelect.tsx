"use client";

import { municipality } from "@/config/municipality";
import type { DbProfile, DbWard } from "@/types/database";

const selectClass = "input-field cursor-pointer";

function wardNumberMap(wards: DbWard[]) {
  return new Map(wards.map((w) => [Number(w.number), w]));
}

type WardSelectProps = {
  wards: DbWard[];
  value: string;
  onChange: (wardId: string) => void;
  placeholder: string;
  required?: boolean;
  loading?: boolean;
  className?: string;
};

/** Ward 1 … Ward 30 — always selectable by number; maps to DB id */
export function WardSelect({
  wards,
  value,
  onChange,
  placeholder,
  required,
  loading = false,
  className = selectClass,
}: WardSelectProps) {
  const byNumber = wardNumberMap(wards);

  const selectedNumber = (() => {
    if (!value) return "";
    const ward = wards.find((w) => w.id === value);
    return ward ? String(Number(ward.number)) : "";
  })();

  return (
    <select
      required={required}
      disabled={loading}
      value={selectedNumber}
      onChange={(e) => {
        const raw = e.target.value;
        if (!raw) {
          onChange("");
          return;
        }
        const ward = byNumber.get(Number(raw));
        if (ward) onChange(ward.id);
      }}
      className={className}
    >
      <option value="">{loading ? "Loading wards…" : placeholder}</option>
      {Array.from({ length: municipality.wardCount }, (_, i) => i + 1).map((num) => (
        <option key={num} value={String(num)}>
          Ward {num}
        </option>
      ))}
    </select>
  );
}

type UserSelectProps = {
  users: DbProfile[];
  wards: DbWard[];
  value: string;
  onChange: (userId: string) => void;
  placeholder: string;
  required?: boolean;
  loading?: boolean;
  emptyHint?: string;
  className?: string;
};

/** All users from DB — username with ward number when assigned */
export function UserSelect({
  users,
  wards,
  value,
  onChange,
  placeholder,
  required,
  loading = false,
  emptyHint = "No users yet — add users in Admin → Users first",
  className = selectClass,
}: UserSelectProps) {
  const wardById = new Map(wards.map((w) => [w.id, w]));

  const sorted = [...users].sort((a, b) =>
    a.username.localeCompare(b.username, undefined, { sensitivity: "base" })
  );

  return (
    <select
      required={required}
      disabled={loading || sorted.length === 0}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">
        {loading ? "Loading users…" : sorted.length === 0 ? emptyHint : placeholder}
      </option>
      {sorted.map((user) => {
        const ward = user.ward_id ? wardById.get(user.ward_id) : undefined;
        const label = ward
          ? `${user.username} — Ward ${Number(ward.number)}`
          : user.username;
        return (
          <option key={user.id} value={user.id}>
            {label}
          </option>
        );
      })}
    </select>
  );
}
