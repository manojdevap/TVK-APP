"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminDeletePetition,
  adminInsertPetition,
  adminListPetitions,
  adminListProfiles,
  adminListWards,
  adminUpdatePetitionPhotos,
  adminUpdatePetitionStatus,
  adminUploadPetitionPhoto,
} from "@/lib/actions/admin-db";
import { UserSelect, WardSelect } from "@/components/admin/WardUserSelect";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { DbPetition, DbProfile, DbWard } from "@/types/database";

const departments = [
  "electricity_board",
  "revenue_board",
  "corporation",
  "water_board",
  "police",
  "other",
] as const;

const emptyForm = {
  title_en: "",
  title_ta: "",
  description_en: "",
  description_ta: "",
  ward_id: "",
  petitioner_id: "",
  department: "corporation",
  status: "submitted",
  submitted_at: new Date().toISOString().slice(0, 10),
};

export function PetitionsManager({ dict }: { dict: Dictionary }) {
  const [petitions, setPetitions] = useState<DbPetition[]>([]);
  const [wards, setWards] = useState<DbWard[]>([]);
  const [profiles, setProfiles] = useState<DbProfile[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, w, pr] = await Promise.all([
        adminListPetitions(),
        adminListWards(),
        adminListProfiles(),
      ]);
      setPetitions(p as DbPetition[]);
      setWards(w as DbWard[]);
      setProfiles(pr as DbProfile[]);
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
      await adminInsertPetition({
        ...form,
        petitioner_id: form.petitioner_id || null,
        photos: [],
      });
      setMessage(dict.admin.success);
      setForm(emptyForm);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : dict.admin.error);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await adminUpdatePetitionStatus(id, status);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : dict.admin.error);
    }
  }

  async function handlePhoto(petitionId: string, file: File) {
    try {
      const fd = new FormData();
      fd.set("file", file);
      const url = await adminUploadPetitionPhoto(fd);
      const petition = petitions.find((p) => p.id === petitionId);
      await adminUpdatePetitionPhotos(petitionId, [...(petition?.photos ?? []), url]);
      setMessage(dict.admin.success);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : dict.admin.error);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete petition?")) return;
    try {
      await adminDeletePetition(id);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : dict.admin.error);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-tvk-maroon-dark">{dict.admin.petitions}</h1>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border bg-white p-6 sm:grid-cols-2">
        <input placeholder={dict.admin.titleEn} required value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="rounded border px-3 py-2 text-sm" />
        <WardSelect
          wards={wards}
          value={form.ward_id}
          onChange={(ward_id) => setForm({ ...form, ward_id })}
          placeholder={dict.admin.selectWard}
          required
          loading={loading}
        />
        <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="rounded border px-3 py-2 text-sm">
          {departments.map((d) => (
            <option key={d} value={d}>{dict.departments[d]}</option>
          ))}
        </select>
        <UserSelect
          users={profiles}
          wards={wards}
          value={form.petitioner_id}
          onChange={(petitioner_id) => setForm({ ...form, petitioner_id })}
          placeholder={dict.admin.selectUser}
          loading={loading}
        />
        <button type="submit" className="sm:col-span-2 w-fit rounded-lg bg-tvk-maroon px-4 py-2 text-sm text-tvk-yellow">
          {dict.admin.add}
        </button>
        {message && <p className="sm:col-span-2 text-sm text-tvk-maroon">{message}</p>}
      </form>

      <ul className="space-y-3">
        {petitions.map((p) => (
          <li key={p.id} className="rounded-xl border bg-white p-4 text-sm">
            <div className="flex justify-between gap-4">
              <strong>{p.title_en}</strong>
              <div className="flex gap-2">
                <select value={p.status} onChange={(e) => updateStatus(p.id, e.target.value)} className="rounded border px-2 py-1 text-xs">
                  {Object.entries(dict.petitionStatus).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <button type="button" onClick={() => remove(p.id)} className="text-red-600">{dict.admin.delete}</button>
              </div>
            </div>
            <label className="mt-2 inline-block cursor-pointer text-tvk-maroon">
              {dict.admin.uploadPhoto}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePhoto(p.id, f);
                }}
              />
            </label>
            {p.photos?.length > 0 && (
              <div className="mt-2 flex gap-2">
                {p.photos.map((url) => (
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
