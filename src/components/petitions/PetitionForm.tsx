"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPetition,
  updatePetition,
  type PetitionInput,
  type PetitionScope,
} from "@/server/petition-actions";
import { OrganiserPicker } from "@/components/events/OrganiserPicker";
import { ErrorNote } from "@/components/ui/Empty";
import { PhotoGalleryField } from "@/components/ui/PhotoGalleryField";
import { LocationField } from "@/components/ui/LocationField";
import type { Department, PetitionStatus } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

export type WardOption = { id: string; number: number; nameEn: string; nameTa: string };

const DEPARTMENTS: Department[] = [
  "corporation",
  "electricity_board",
  "water_board",
  "revenue_board",
  "police",
  "other",
];

const STATUSES: PetitionStatus[] = ["submitted", "in_progress", "resolved", "rejected"];

export function PetitionForm({
  locale,
  dict,
  wards,
  petition,
  petitionId,
  handlerName,
  cancelHref,
}: {
  locale: Locale;
  dict: Dictionary;
  wards: WardOption[];
  petition?: PetitionInput;
  petitionId?: string;
  handlerName?: string;
  cancelHref: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<PetitionInput>(
    petition ?? {
      title: "",
      scope: "ward",
      wardId: "",
      place: "",
      latitude: null,
      longitude: null,
      petitionerName: "",
      petitionerPhone: "",
      submittedOn: new Date().toISOString().slice(0, 10),
      description: "",
      department: "corporation",
      departmentOther: "",
      status: "submitted",
      handledById: "",
      photoUrls: [],
    }
  );
  const [handlerLabel, setHandlerLabel] = useState(handlerName ?? "");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  function set<K extends keyof PetitionInput>(key: K, value: PetitionInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function errorFor(field: string) {
    return fieldError === field ? error : undefined;
  }

  function chooseWard(wardId: string) {
    // Whoever is handling it should come from the ward the grievance belongs to.
    setForm((prev) => ({ ...prev, wardId, handledById: "" }));
    setHandlerLabel("");
  }

  function chooseScope(scope: PetitionScope) {
    setForm((prev) => ({
      ...prev,
      scope,
      // A town-wide grievance has no ward, and the handler was picked from one.
      wardId: scope === "municipality" ? "" : prev.wardId,
      handledById: "",
    }));
    setHandlerLabel("");
  }

  async function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    setBusy(true);
    setError("");
    setFieldError(undefined);

    const result = petitionId
      ? await updatePetition(petitionId, form)
      : await createPetition(form);

    if (!result.ok) {
      setError(result.error);
      setFieldError(result.field);
      setBusy(false);
      return;
    }

    router.push(`/${locale}/petitions/${result.data.id}`);
    router.refresh();
  }

  const wardLabel = (ward: WardOption) => {
    const name = locale === "ta" && ward.nameTa ? ward.nameTa : ward.nameEn;
    return `${dict.wards.ward} ${ward.number}${name ? ` — ${name}` : ""}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="card space-y-4">
        <div>
          <label className="field-label" htmlFor="title">
            {dict.petitions.complaint}
          </label>
          <input
            id="title"
            className="field"
            required
            autoFocus={!petitionId}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
          {errorFor("title") ? (
            <p className="field-error">{errorFor("title")}</p>
          ) : (
            <p className="field-hint">{dict.petitions.complaintHint}</p>
          )}
        </div>

        <fieldset>
          <legend className="field-label">{dict.petitions.affects}</legend>
          <div className="flex gap-2">
            {(
              [
                { value: "ward", label: dict.petitions.scopeWard },
                { value: "municipality", label: dict.petitions.scopeMunicipality },
              ] as { value: PetitionScope; label: string }[]
            ).map((option) => (
              <label
                key={option.value}
                className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border px-2 text-center text-sm font-medium transition ${
                  form.scope === option.value
                    ? "border-maroon bg-yellow-soft text-maroon-dark"
                    : "border-border bg-surface text-muted"
                }`}
              >
                <input
                  type="radio"
                  name="scope"
                  value={option.value}
                  checked={form.scope === option.value}
                  onChange={() => chooseScope(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
          <p className="field-hint">
            {form.scope === "municipality"
              ? dict.petitions.scopeMunicipalityHint
              : dict.petitions.scopeWardHint}
          </p>
          {errorFor("scope") && <p className="field-error">{errorFor("scope")}</p>}
        </fieldset>

        {form.scope === "ward" && (
          <div>
            <label className="field-label" htmlFor="wardId">
              {dict.petitions.ward}
            </label>
            <select
              id="wardId"
              className="field"
              required
              value={form.wardId ?? ""}
              onChange={(e) => chooseWard(e.target.value)}
            >
              <option value="">—</option>
              {wards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {wardLabel(ward)}
                </option>
              ))}
            </select>
            {errorFor("wardId") && <p className="field-error">{errorFor("wardId")}</p>}
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="department">
            {dict.petitions.department}
          </label>
          <select
            id="department"
            className="field"
            value={form.department ?? "corporation"}
            onChange={(e) => set("department", e.target.value)}
          >
            {DEPARTMENTS.map((code) => (
              <option key={code} value={code}>
                {dict.departments[code]}
              </option>
            ))}
          </select>
          {errorFor("department") && <p className="field-error">{errorFor("department")}</p>}
        </div>

        {form.department === "other" && (
          <div>
            <label className="field-label" htmlFor="departmentOther">
              {dict.petitions.departmentOther}
            </label>
            <input
              id="departmentOther"
              className="field"
              required
              autoComplete="off"
              placeholder={dict.petitions.departmentOtherPlaceholder}
              value={form.departmentOther ?? ""}
              onChange={(e) => set("departmentOther", e.target.value)}
            />
            {errorFor("departmentOther") ? (
              <p className="field-error">{errorFor("departmentOther")}</p>
            ) : (
              <p className="field-hint">{dict.petitions.departmentOtherHint}</p>
            )}
          </div>
        )}
      </div>

      <div className="card space-y-4">
        <p className="section-title">{dict.location.place}</p>

        <div>
          <label className="field-label" htmlFor="place">
            {dict.location.place}{" "}
            <span className="font-normal text-muted">({dict.common.optional})</span>
          </label>
          <input
            id="place"
            className="field"
            value={form.place ?? ""}
            onChange={(e) => set("place", e.target.value)}
          />
          {errorFor("place") ? (
            <p className="field-error">{errorFor("place")}</p>
          ) : (
            <p className="field-hint">{dict.location.placeHint}</p>
          )}
        </div>

        <LocationField
          dict={dict}
          value={
            form.latitude != null && form.longitude != null
              ? { latitude: form.latitude, longitude: form.longitude }
              : null
          }
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              latitude: value?.latitude ?? null,
              longitude: value?.longitude ?? null,
            }))
          }
          error={errorFor("latitude")}
        />
      </div>

      <div className="card space-y-4">
        <p className="section-title">{dict.petitions.whoRaised}</p>

        <div>
          <label className="field-label" htmlFor="petitionerName">
            {dict.petitions.petitionerName}
          </label>
          <input
            id="petitionerName"
            className="field"
            required
            autoComplete="off"
            value={form.petitionerName}
            onChange={(e) => set("petitionerName", e.target.value)}
          />
          {errorFor("petitionerName") ? (
            <p className="field-error">{errorFor("petitionerName")}</p>
          ) : (
            <p className="field-hint">{dict.petitions.petitionerHint}</p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor="petitionerPhone">
            {dict.petitions.petitionerPhone}{" "}
            <span className="font-normal text-muted">({dict.common.optional})</span>
          </label>
          <input
            id="petitionerPhone"
            className="field"
            type="tel"
            inputMode="numeric"
            value={form.petitionerPhone ?? ""}
            onChange={(e) => set("petitionerPhone", e.target.value)}
          />
          {errorFor("petitionerPhone") && (
            <p className="field-error">{errorFor("petitionerPhone")}</p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor="submittedOn">
            {dict.petitions.submittedOn}
          </label>
          <input
            id="submittedOn"
            className="field"
            type="date"
            required
            value={form.submittedOn}
            onChange={(e) => set("submittedOn", e.target.value)}
          />
          {errorFor("submittedOn") && <p className="field-error">{errorFor("submittedOn")}</p>}
        </div>
      </div>

      <div className="card space-y-4">
        <p className="section-title">{dict.petitions.progress}</p>

        <div>
          <label className="field-label" htmlFor="status">
            {dict.petitions.status}
          </label>
          <select
            id="status"
            className="field"
            value={form.status ?? "submitted"}
            onChange={(e) => set("status", e.target.value)}
          >
            {STATUSES.map((code) => (
              <option key={code} value={code}>
                {dict.petitionStatus[code]}
              </option>
            ))}
          </select>
          {errorFor("status") && <p className="field-error">{errorFor("status")}</p>}
        </div>

        <OrganiserPicker
          dict={dict}
          wardId={form.scope === "ward" ? (form.wardId ?? "") : ""}
          value={form.handledById ?? ""}
          valueLabel={handlerLabel}
          onChange={(id, label) => {
            set("handledById", id);
            setHandlerLabel(label);
          }}
          error={errorFor("handledById")}
          label={dict.petitions.handledBy}
        />

        <div>
          <label className="field-label" htmlFor="description">
            {dict.petitions.description}{" "}
            <span className="font-normal text-muted">({dict.common.optional})</span>
          </label>
          <textarea
            id="description"
            className="field"
            rows={4}
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
          {errorFor("description") && <p className="field-error">{errorFor("description")}</p>}
        </div>

        <PhotoGalleryField
          dict={dict}
          folder="petitions"
          max={20}
          label={dict.petitions.photos}
          hint={dict.petitions.photosHint}
          value={form.photoUrls ?? []}
          onChange={(urls) => set("photoUrls", urls)}
          error={errorFor("photoUrls")}
        />
      </div>

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
