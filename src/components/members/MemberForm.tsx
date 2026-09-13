"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMember, updateMember, type MemberInput } from "@/server/member-actions";
import { ErrorNote } from "@/components/ui/Empty";
import { PhotoField } from "@/components/ui/PhotoField";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

export type RoleOption = { id: string; nameEn: string; nameTa: string };
export type WardOption = { id: string; number: number; nameEn: string; nameTa: string };

const emptyForm: MemberInput = {
  fullName: "",
  wardId: "",
  roleId: "",
  gender: "male",
  phone: "",
  address: "",
  voterId: "",
  photoUrl: "",
  joinedOn: "",
  notes: "",
};

/**
 * Four required fields — name, ward, role, gender. Everything else can be filled in
 * later, because the previous version's mandatory voter-ID lookup was the reason
 * adding a member took minutes instead of seconds.
 */
export function MemberForm({
  locale,
  dict,
  wards,
  roles,
  member,
  memberId,
  cancelHref,
}: {
  locale: Locale;
  dict: Dictionary;
  wards: WardOption[];
  roles: RoleOption[];
  member?: MemberInput;
  memberId?: string;
  cancelHref: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<MemberInput>(
    member ?? { ...emptyForm, roleId: roles[roles.length - 1]?.id ?? "" }
  );
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [showOptional, setShowOptional] = useState(
    Boolean(member?.phone || member?.address || member?.voterId || member?.joinedOn || member?.notes)
  );

  function set<K extends keyof MemberInput>(key: K, value: MemberInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function errorFor(field: string) {
    return fieldError === field ? error : undefined;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFieldError(undefined);

    const result = memberId ? await updateMember(memberId, form) : await createMember(form);

    if (!result.ok) {
      setError(result.error);
      setFieldError(result.field);
      setBusy(false);
      // Optional fields are collapsed by default — open them if that's where the problem is.
      if (result.field && ["phone", "voterId", "joinedOn", "notes", "address"].includes(result.field)) {
        setShowOptional(true);
      }
      return;
    }

    router.push(cancelHref);
    router.refresh();
  }

  const localeName = <T extends { nameEn: string; nameTa: string }>(item: T) =>
    locale === "ta" && item.nameTa ? item.nameTa : item.nameEn;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="card space-y-4">
        <div>
          <label className="field-label" htmlFor="fullName">
            {dict.members.fullName}
          </label>
          <input
            id="fullName"
            className="field"
            required
            autoComplete="name"
            autoFocus={!memberId}
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
          />
          {errorFor("fullName") && <p className="field-error">{errorFor("fullName")}</p>}
        </div>

        <div>
          <label className="field-label" htmlFor="wardId">
            {dict.members.ward}
          </label>
          <select
            id="wardId"
            className="field"
            required
            value={form.wardId}
            onChange={(e) => set("wardId", e.target.value)}
          >
            <option value="">—</option>
            {wards.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {dict.wards.ward} {ward.number}
                {localeName(ward) ? ` — ${localeName(ward)}` : ""}
              </option>
            ))}
          </select>
          {errorFor("wardId") && <p className="field-error">{errorFor("wardId")}</p>}
        </div>

        <div>
          <label className="field-label" htmlFor="roleId">
            {dict.members.role}
          </label>
          <select
            id="roleId"
            className="field"
            required
            value={form.roleId}
            onChange={(e) => set("roleId", e.target.value)}
          >
            <option value="">—</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {localeName(role)}
              </option>
            ))}
          </select>
          {errorFor("roleId") && <p className="field-error">{errorFor("roleId")}</p>}
        </div>

        <PhotoField
          dict={dict}
          folder="members"
          value={form.photoUrl ?? ""}
          onChange={(url) => set("photoUrl", url)}
          error={errorFor("photoUrl")}
        />

        <fieldset>
          <legend className="field-label">{dict.gender.label}</legend>
          <div className="flex gap-2">
            {(["male", "female", "other"] as const).map((value) => (
              <label
                key={value}
                className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border text-sm font-medium transition ${
                  form.gender === value
                    ? "border-maroon bg-yellow-soft text-maroon-dark"
                    : "border-border bg-surface text-muted"
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={value}
                  checked={form.gender === value}
                  onChange={() => set("gender", value)}
                  className="sr-only"
                />
                {dict.gender[value]}
              </label>
            ))}
          </div>
          {errorFor("gender") && <p className="field-error">{errorFor("gender")}</p>}
        </fieldset>
      </div>

      <button
        type="button"
        onClick={() => setShowOptional((open) => !open)}
        className="tap-row card justify-between font-medium text-maroon"
        aria-expanded={showOptional}
      >
        <span>
          {dict.members.phone}, {dict.members.address}, {dict.members.voterId}…
        </span>
        <span aria-hidden="true">{showOptional ? "−" : "+"}</span>
      </button>

      {showOptional && (
        <div className="card space-y-4">
          <div>
            <label className="field-label" htmlFor="phone">
              {dict.members.phone}{" "}
              <span className="font-normal text-muted">({dict.common.optional})</span>
            </label>
            <input
              id="phone"
              className="field"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={form.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
            />
            {errorFor("phone") && <p className="field-error">{errorFor("phone")}</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="voterId">
              {dict.members.voterId}{" "}
              <span className="font-normal text-muted">({dict.common.optional})</span>
            </label>
            <input
              id="voterId"
              className="field font-mono uppercase"
              maxLength={10}
              autoCapitalize="characters"
              autoCorrect="off"
              value={form.voterId ?? ""}
              onChange={(e) => set("voterId", e.target.value.toUpperCase())}
            />
            {errorFor("voterId") ? (
              <p className="field-error">{errorFor("voterId")}</p>
            ) : (
              <p className="field-hint">{dict.members.voterIdHint}</p>
            )}
          </div>

          <div>
            <label className="field-label" htmlFor="address">
              {dict.members.address}{" "}
              <span className="font-normal text-muted">({dict.common.optional})</span>
            </label>
            <textarea
              id="address"
              className="field"
              rows={2}
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
            />
            {errorFor("address") && <p className="field-error">{errorFor("address")}</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="joinedOn">
              {dict.members.joinedOn}{" "}
              <span className="font-normal text-muted">({dict.common.optional})</span>
            </label>
            <input
              id="joinedOn"
              className="field"
              type="date"
              value={form.joinedOn ?? ""}
              onChange={(e) => set("joinedOn", e.target.value)}
            />
            {errorFor("joinedOn") && <p className="field-error">{errorFor("joinedOn")}</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="notes">
              {dict.members.notes}{" "}
              <span className="font-normal text-muted">({dict.common.optional})</span>
            </label>
            <textarea
              id="notes"
              className="field"
              rows={2}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
            />
            {errorFor("notes") && <p className="field-error">{errorFor("notes")}</p>}
          </div>
        </div>
      )}

      {error && !fieldError && <ErrorNote>{error}</ErrorNote>}

      <div className="flex gap-2 pb-2">
        <button type="submit" className="btn-primary flex-1" disabled={busy}>
          {busy ? dict.common.saving : dict.common.save}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.push(cancelHref)}>
          {dict.common.cancel}
        </button>
      </div>
    </form>
  );
}
