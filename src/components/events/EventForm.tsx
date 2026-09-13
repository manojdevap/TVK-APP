"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent, updateEvent, type EventInput, type EventScope } from "@/server/event-actions";
import { OrganiserPicker } from "@/components/events/OrganiserPicker";
import { ErrorNote } from "@/components/ui/Empty";
import { PhotoField } from "@/components/ui/PhotoField";
import { PhotoGalleryField } from "@/components/ui/PhotoGalleryField";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

export type WardOption = { id: string; number: number; nameEn: string; nameTa: string };

export function EventForm({
  locale,
  dict,
  wards,
  event,
  eventId,
  organiserName,
  cancelHref,
}: {
  locale: Locale;
  dict: Dictionary;
  wards: WardOption[];
  event?: EventInput;
  eventId?: string;
  organiserName?: string;
  cancelHref: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<EventInput>(
    event ?? {
      title: "",
      eventDate: new Date().toISOString().slice(0, 10),
      scope: "ward",
      wardId: "",
      description: "",
      bannerUrl: "",
      galleryUrls: [],
      organiserId: "",
    }
  );
  const [organiserLabel, setOrganiserLabel] = useState(organiserName ?? "");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  function set<K extends keyof EventInput>(key: K, value: EventInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function errorFor(field: string) {
    return fieldError === field ? error : undefined;
  }

  function chooseScope(scope: EventScope) {
    setForm((prev) => ({
      ...prev,
      scope,
      // A party-wide event has no ward, and the previously chosen organiser was
      // picked from a ward that no longer applies.
      wardId: scope === "party" ? "" : prev.wardId,
      organiserId: "",
    }));
    setOrganiserLabel("");
  }

  function chooseWard(wardId: string) {
    setForm((prev) => ({ ...prev, wardId, organiserId: "" }));
    setOrganiserLabel("");
  }

  async function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    setBusy(true);
    setError("");
    setFieldError(undefined);

    const result = eventId ? await updateEvent(eventId, form) : await createEvent(form);

    if (!result.ok) {
      setError(result.error);
      setFieldError(result.field);
      setBusy(false);
      return;
    }

    // Land on the event just saved, so a new one is visible straight away rather
    // than having to be found again in the list.
    router.push(`/${locale}/events/${result.data.id}`);
    router.refresh();
  }

  const wardLabel = (ward: WardOption) => {
    const name = locale === "ta" && ward.nameTa ? ward.nameTa : ward.nameEn;
    return `${dict.wards.ward} ${ward.number}${name ? ` — ${name}` : ""}`;
  };

  const scopes: { value: EventScope; label: string }[] = [
    { value: "ward", label: dict.events.scopeWard },
    { value: "party", label: dict.events.scopeParty },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="card space-y-4">
        <div>
          <label className="field-label" htmlFor="title">
            {dict.events.eventTitle}
          </label>
          <input
            id="title"
            className="field"
            required
            autoFocus={!eventId}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
          {errorFor("title") && <p className="field-error">{errorFor("title")}</p>}
        </div>

        <div>
          <label className="field-label" htmlFor="eventDate">
            {dict.events.date}
          </label>
          <input
            id="eventDate"
            className="field"
            type="date"
            required
            value={form.eventDate}
            onChange={(e) => set("eventDate", e.target.value)}
          />
          {errorFor("eventDate") && <p className="field-error">{errorFor("eventDate")}</p>}
        </div>

        <fieldset>
          <legend className="field-label">{dict.events.organisedFor}</legend>
          <div className="flex gap-2">
            {scopes.map((option) => (
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
            {form.scope === "party" ? dict.events.scopePartyHint : dict.events.scopeWardHint}
          </p>
          {errorFor("scope") && <p className="field-error">{errorFor("scope")}</p>}
        </fieldset>

        {form.scope === "ward" && (
          <div>
            <label className="field-label" htmlFor="wardId">
              {dict.events.ward}
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

        <OrganiserPicker
          dict={dict}
          wardId={form.scope === "ward" ? (form.wardId ?? "") : ""}
          value={form.organiserId ?? ""}
          valueLabel={organiserLabel}
          onChange={(id, label) => {
            set("organiserId", id);
            setOrganiserLabel(label);
          }}
          error={errorFor("organiserId")}
        />

        <PhotoField
          dict={dict}
          folder="events"
          label={dict.events.banner}
          hint={dict.events.bannerHint}
          value={form.bannerUrl ?? ""}
          onChange={(url) => set("bannerUrl", url)}
          error={errorFor("bannerUrl")}
        />

        <PhotoGalleryField
          dict={dict}
          folder="events"
          value={form.galleryUrls ?? []}
          onChange={(urls) => set("galleryUrls", urls)}
          error={errorFor("galleryUrls")}
        />

        <div>
          <label className="field-label" htmlFor="description">
            {dict.events.description}{" "}
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
