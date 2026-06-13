"use client";

type WardOption = { id: string; label: string };

type WardFilterProps = {
  value: string;
  onChange: (wardId: string) => void;
  wards: WardOption[];
  allLabel: string;
  label?: string;
  className?: string;
};

export function WardFilter({
  value,
  onChange,
  wards,
  allLabel,
  label,
  className = "",
}: WardFilterProps) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      {label && <span className="font-medium text-muted">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground"
      >
        <option value="">{allLabel}</option>
        {wards.map((w) => (
          <option key={w.id} value={w.id}>
            {w.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type RoleFilterProps = {
  value: string;
  onChange: (role: string) => void;
  roles: { value: string; label: string }[];
  allLabel: string;
  label?: string;
  className?: string;
};

export function RoleFilter({
  value,
  onChange,
  roles,
  allLabel,
  label,
  className = "",
}: RoleFilterProps) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      {label && <span className="font-medium text-muted">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground"
      >
        <option value="">{allLabel}</option>
        {roles.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4">
      {children}
    </div>
  );
}
