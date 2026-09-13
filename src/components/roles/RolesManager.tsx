"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createRole, deleteRole, updateRole, type RoleInput } from "@/server/role-actions";
import { ErrorNote } from "@/components/ui/Empty";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

export type RoleRow = {
  id: string;
  nameEn: string;
  nameTa: string;
  maxPerWard: number | null;
  sortOrder: number;
  isSystem: boolean;
  memberCount: number;
};

const blank: RoleInput = { nameEn: "", nameTa: "", maxPerWard: "", sortOrder: "" };

export function RolesManager({
  locale,
  dict,
  roles,
}: {
  locale: Locale;
  dict: Dictionary;
  roles: RoleRow[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RoleInput>(blank);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function startCreate() {
    setEditingId(null);
    setForm(blank);
    setError("");
    setOpen(true);
  }

  function startEdit(role: RoleRow) {
    setEditingId(role.id);
    setForm({
      nameEn: role.nameEn,
      nameTa: role.nameTa,
      maxPerWard: role.maxPerWard ?? "",
      sortOrder: role.sortOrder,
    });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const result = editingId ? await updateRole(editingId, form) : await createRole(form);

    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setOpen(false);
    setForm(blank);
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(role: RoleRow) {
    if (!confirm(dict.roles.confirmDelete)) return;

    setError("");
    const result = await deleteRole(role.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const name = (role: RoleRow) => (locale === "ta" && role.nameTa ? role.nameTa : role.nameEn);

  return (
    <div className="space-y-3">
      {error && <ErrorNote>{error}</ErrorNote>}

      <ul className="space-y-2">
        {roles.map((role) => (
          <li key={role.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{name(role)}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {role.maxPerWard === null
                    ? dict.roles.noLimit
                    : `${role.maxPerWard} ${dict.roles.perWard}`}
                  {" · "}
                  {role.memberCount} {dict.roles.inUse}
                  {role.isSystem ? ` · ${dict.roles.builtIn}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-3 text-sm font-medium">
                <button type="button" className="text-maroon" onClick={() => startEdit(role)}>
                  {dict.common.edit}
                </button>
                {!role.isSystem && (
                  <button type="button" className="text-danger" onClick={() => handleDelete(role)}>
                    {dict.common.delete}
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted">{dict.roles.cannotDeleteBuiltIn}</p>

      {!open ? (
        <button type="button" className="btn-primary w-full" onClick={startCreate}>
          {dict.roles.addRole}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <p className="font-medium text-maroon-dark">
            {editingId ? dict.roles.editRole : dict.roles.addRole}
          </p>

          <div>
            <label className="field-label" htmlFor="role-name-en">
              {dict.roles.nameEn}
            </label>
            <input
              id="role-name-en"
              className="field"
              required
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="role-name-ta">
              {dict.roles.nameTa}
            </label>
            <input
              id="role-name-ta"
              className="field"
              value={form.nameTa ?? ""}
              onChange={(e) => setForm({ ...form, nameTa: e.target.value })}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="role-max">
              {dict.roles.maxPerWard}{" "}
              <span className="font-normal text-muted">({dict.common.optional})</span>
            </label>
            <input
              id="role-max"
              className="field"
              type="number"
              inputMode="numeric"
              min={1}
              value={form.maxPerWard ?? ""}
              onChange={(e) => setForm({ ...form, maxPerWard: e.target.value })}
            />
            <p className="field-hint">{dict.roles.maxPerWardHint}</p>
          </div>

          <div>
            <label className="field-label" htmlFor="role-order">
              {dict.roles.sortOrder}
            </label>
            <input
              id="role-order"
              className="field"
              type="number"
              inputMode="numeric"
              min={1}
              value={form.sortOrder ?? ""}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
            <p className="field-hint">{dict.roles.sortOrderHint}</p>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={busy}>
              {busy ? dict.common.saving : dict.common.save}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              {dict.common.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
