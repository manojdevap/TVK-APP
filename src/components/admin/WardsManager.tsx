"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminDeleteWard,
  adminListWards,
  adminUpsertWard,
} from "@/lib/actions/admin-db";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { DbWard } from "@/types/database";

const emptyForm = {
  number: "",
  name_en: "",
  name_ta: "",
  area_en: "",
  area_ta: "",
  total_voters: "0",
  our_votes: "0",
  male_voters: "0",
  female_voters: "0",
};

export function WardsManager({ dict }: { dict: Dictionary }) {
  const [wards, setWards] = useState<DbWard[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setWards((await adminListWards()) as DbWard[]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : dict.admin.error);
    }
  }, [dict.admin.error]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        number: Number(form.number),
        name_en: form.name_en,
        name_ta: form.name_ta,
        area_en: form.area_en,
        area_ta: form.area_ta,
        total_voters: Number(form.total_voters),
        our_votes: Number(form.our_votes),
        male_voters: Number(form.male_voters),
        female_voters: Number(form.female_voters),
      };
      await adminUpsertWard(payload, editingId ?? undefined);
      setMessage(dict.admin.success);
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : dict.admin.error);
    }
  }

  function startEdit(w: DbWard) {
    setEditingId(w.id);
    setForm({
      number: String(w.number),
      name_en: w.name_en,
      name_ta: w.name_ta,
      area_en: w.area_en,
      area_ta: w.area_ta,
      total_voters: String(w.total_voters),
      our_votes: String(w.our_votes),
      male_voters: String(w.male_voters),
      female_voters: String(w.female_voters),
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this ward?")) return;
    try {
      await adminDeleteWard(id);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : dict.admin.error);
    }
  }

  const fields = [
    { key: "number", label: dict.admin.wardNumber },
    { key: "name_en", label: dict.admin.nameEn },
    { key: "name_ta", label: dict.admin.nameTa },
    { key: "area_en", label: dict.admin.areaEn },
    { key: "area_ta", label: dict.admin.areaTa },
    { key: "total_voters", label: dict.admin.totalVoters },
    { key: "our_votes", label: dict.admin.ourVotes },
    { key: "male_voters", label: dict.admin.maleVoters },
    { key: "female_voters", label: dict.admin.femaleVoters },
  ] as const;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-tvk-maroon-dark">{dict.admin.wards}</h1>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border bg-white p-6 sm:grid-cols-2">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <label className="text-xs font-medium text-slate-600">{label}</label>
            <input
              required={key === "number" || key === "name_en"}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="input-field mt-1"
            />
          </div>
        ))}
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className="btn-primary">
            {editingId ? dict.admin.save : dict.admin.add}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm(emptyForm); }}
              className="btn-secondary"
            >
              {dict.admin.cancel}
            </button>
          )}
        </div>
        {message && <p className="sm:col-span-2 text-sm text-tvk-maroon">{message}</p>}
      </form>

      <ul className="divide-y rounded-xl border bg-white">
        {wards.map((w) => (
          <li key={w.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              <strong>Ward {w.number}</strong> — {w.name_en}
            </span>
            <span className="flex gap-2">
              <button type="button" onClick={() => startEdit(w)} className="text-tvk-maroon">
                {dict.admin.edit}
              </button>
              <button type="button" onClick={() => remove(w.id)} className="text-red-600">
                {dict.admin.delete}
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
