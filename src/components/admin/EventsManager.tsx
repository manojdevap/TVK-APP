"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminDeleteEvent,
  adminInsertEvent,
  adminListEvents,
  adminListProfiles,
  adminListWards,
  adminUpdateEventPhotos,
  adminUploadEventPhoto,
} from "@/lib/actions/admin-db";
import { UserSelect, WardSelect } from "@/components/admin/WardUserSelect";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { DbEvent, DbProfile, DbWard } from "@/types/database";

const emptyForm = {
  title_en: "",
  title_ta: "",
  description_en: "",
  description_ta: "",
  ward_id: "",
  event_date: "",
  location: "",
  status: "planned",
  organiser_id: "",
};

export function EventsManager({ dict }: { dict: Dictionary }) {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [wards, setWards] = useState<DbWard[]>([]);
  const [profiles, setProfiles] = useState<DbProfile[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ev, w, p] = await Promise.all([
        adminListEvents(),
        adminListWards(),
        adminListProfiles(),
      ]);
      setEvents(ev as DbEvent[]);
      setWards(w as DbWard[]);
      setProfiles(p as DbProfile[]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : dict.admin.error);
    } finally {
      setLoading(false);
    }
  }, [dict.admin.error]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminInsertEvent({
        ...form,
        organiser_id: form.organiser_id || null,
        photos: [],
      });
      setMessage(dict.admin.success);
      setForm(emptyForm);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : dict.admin.error);
    }
  }

  async function handlePhoto(eventId: string, file: File) {
    try {
      const fd = new FormData();
      fd.set("file", file);
      const url = await adminUploadEventPhoto(fd);
      const event = events.find((ev) => ev.id === eventId);
      await adminUpdateEventPhotos(eventId, [...(event?.photos ?? []), url]);
      setMessage(dict.admin.success);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : dict.admin.error);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete event?")) return;
    try {
      await adminDeleteEvent(id);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : dict.admin.error);
    }
  }

  const wardById = new Map(wards.map((w) => [w.id, w]));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-tvk-maroon-dark">{dict.admin.events}</h1>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border bg-white p-6 sm:grid-cols-2">
        <input placeholder={dict.admin.titleEn} required value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="rounded border px-3 py-2 text-sm" />
        <input placeholder={dict.admin.titleTa} value={form.title_ta} onChange={(e) => setForm({ ...form, title_ta: e.target.value })} className="rounded border px-3 py-2 text-sm" />
        <textarea placeholder={dict.admin.descriptionEn} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className="sm:col-span-2 rounded border px-3 py-2 text-sm" rows={2} />
        <WardSelect
          wards={wards}
          value={form.ward_id}
          onChange={(ward_id) => setForm({ ...form, ward_id })}
          placeholder={dict.admin.selectWard}
          required
          loading={loading}
        />
        <input type="date" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="rounded border px-3 py-2 text-sm" />
        <input placeholder={dict.admin.location} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="rounded border px-3 py-2 text-sm" />
        <UserSelect
          users={profiles}
          wards={wards}
          value={form.organiser_id}
          onChange={(organiser_id) => setForm({ ...form, organiser_id })}
          placeholder={dict.admin.selectUser}
          loading={loading}
        />
        <button type="submit" className="sm:col-span-2 w-fit rounded-lg bg-tvk-maroon px-4 py-2 text-sm text-tvk-yellow">
          {dict.admin.add}
        </button>
        {message && <p className="sm:col-span-2 text-sm text-tvk-maroon">{message}</p>}
      </form>

      <ul className="space-y-4">
        {events.map((ev) => (
          <li key={ev.id} className="rounded-xl border bg-white p-4 text-sm">
            <div className="flex justify-between gap-2">
              <div>
                <strong>{ev.title_en}</strong>
                {wardById.get(ev.ward_id) && (
                  <span className="ml-2 text-muted">· Ward {wardById.get(ev.ward_id)!.number}</span>
                )}
              </div>
              <button type="button" onClick={() => remove(ev.id)} className="text-red-600">{dict.admin.delete}</button>
            </div>
            <label className="mt-2 inline-block cursor-pointer text-tvk-maroon">
              {dict.admin.uploadPhoto}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhoto(ev.id, f);
              }} />
            </label>
            {ev.photos?.length > 0 && (
              <div className="mt-2 flex gap-2">
                {ev.photos.map((url) => (
                  <img key={url} src={url} alt="" className="h-16 w-16 rounded object-cover" />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
