"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminDeleteProfile,
  adminListProfiles,
  adminListWards,
  adminUploadProfilePhoto,
  adminUpsertProfile,
} from "@/lib/actions/admin-db";
import { WardSelect } from "@/components/admin/WardUserSelect";
import { importVotersToDb } from "@/lib/data/admin-mutations";
import { parseVotersCsv } from "@/lib/csv-voters";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { DbProfile, DbWard } from "@/types/database";

const emptyForm = {
  username: "",
  address: "",
  voter_id: "",
  ward_id: "",
  role: "ward_member",
  gender: "male",
  phone: "",
  is_our_vote: false,
};

export function UsersManager({ dict }: { dict: Dictionary }) {
  const [users, setUsers] = useState<DbProfile[]>([]);
  const [wards, setWards] = useState<DbWard[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [profiles, wardRows] = await Promise.all([
        adminListProfiles(),
        adminListWards(),
      ]);
      setUsers(profiles as DbProfile[]);
      setWards(wardRows as DbWard[]);
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
      await adminUpsertProfile({
        username: form.username,
        address: form.address,
        voter_id: form.voter_id || null,
        ward_id: form.ward_id || null,
        role: form.role,
        gender: form.gender,
        phone: form.phone || null,
        is_our_vote: form.is_our_vote,
      });
      setMessage(dict.admin.success);
      setForm(emptyForm);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : dict.admin.error);
    }
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const wardNumbers = wards.map((w) => w.number);
    const result = parseVotersCsv(text, wardNumbers);
    if (!result.rows.length) {
      setMessage(result.errors[0]?.message ?? dict.admin.error);
      return;
    }
    const wardMap = Object.fromEntries(wards.map((w) => [w.number, w.id]));
    try {
      const count = await importVotersToDb(result.rows, wardMap);
      setMessage(`${count} ${dict.admin.imported}`);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : dict.admin.error);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete user?")) return;
    try {
      await adminDeleteProfile(id);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : dict.admin.error);
    }
  }

  async function handleAvatar(profileId: string, file: File) {
    try {
      const fd = new FormData();
      fd.set("file", file);
      await adminUploadProfilePhoto(profileId, fd);
      setMessage(dict.admin.success);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : dict.admin.error);
    }
  }

  const wardById = new Map(wards.map((w) => [w.id, w]));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-tvk-maroon-dark">{dict.admin.users}</h1>

      <div className="rounded-xl border border-dashed border-tvk-yellow bg-tvk-yellow/10 p-4">
        <label className="cursor-pointer text-sm font-medium text-tvk-maroon-dark">
          {dict.admin.importCsv}
          <input type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
        </label>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border bg-white p-6 sm:grid-cols-2">
        <input placeholder={dict.users.name} required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="rounded border px-3 py-2 text-sm" />
        <input placeholder={dict.users.voterId} value={form.voter_id} onChange={(e) => setForm({ ...form, voter_id: e.target.value })} className="rounded border px-3 py-2 text-sm" />
        <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="sm:col-span-2 rounded border px-3 py-2 text-sm" />
        <WardSelect
          wards={wards}
          value={form.ward_id}
          onChange={(ward_id) => setForm({ ...form, ward_id })}
          placeholder={dict.admin.selectWard}
          loading={loading}
        />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded border px-3 py-2 text-sm">
          {Object.entries(dict.roles).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="rounded border px-3 py-2 text-sm">
          <option value="male">{dict.common.male}</option>
          <option value="female">{dict.common.female}</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_our_vote} onChange={(e) => setForm({ ...form, is_our_vote: e.target.checked })} />
          {dict.users.ourVote}
        </label>
        <button type="submit" className="sm:col-span-2 w-fit rounded-lg bg-tvk-maroon px-4 py-2 text-sm text-tvk-yellow">
          {dict.admin.add}
        </button>
        {message && <p className="sm:col-span-2 text-sm text-tvk-maroon">{message}</p>}
      </form>

      <ul className="divide-y rounded-xl border bg-white text-sm">
        {users.map((u) => {
          const ward = u.ward_id ? wardById.get(u.ward_id) : undefined;
          return (
            <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tvk-yellow/30 text-xs text-tvk-maroon">
                    {u.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span>
                  {u.username} — {dict.roles[u.role]}
                  {ward ? ` · Ward ${ward.number}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer text-tvk-maroon">
                  {dict.admin.uploadPhoto}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAvatar(u.id, f);
                    }}
                  />
                </label>
                <button type="button" onClick={() => remove(u.id)} className="text-red-600">{dict.admin.delete}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
