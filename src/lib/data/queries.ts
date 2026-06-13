import { municipality } from "@/config/municipality";
import type { Locale } from "@/i18n/config";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { DbEvent, DbPetition, DbProfile, DbWard } from "@/types/database";
import type { Event, Petition, User, Ward } from "@/types";
import { events as mockEvents, petitions as mockPetitions, users as mockUsers, wards as mockWards } from "@/data/mock";
import { mapEvent, mapPetition, mapProfile, mapWard } from "./mappers";

export type DataSource = "supabase" | "mock" | "demo";

type FetchResult<T> = { data: T; source: DataSource };

/** Sync hint for layout — pages should prefer `source` from fetch* results */
export function getDataSource(): DataSource {
  return isSupabaseConfigured() ? "supabase" : "mock";
}

async function isDatabaseSeeded(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[Supabase seed check]", error);
    return false;
  }
  return (count ?? 0) > 0;
}

async function getMemberIdsByWard(
  profiles: DbProfile[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  for (const p of profiles) {
    if (p.ward_id && p.role === "ward_member") {
      const list = map.get(p.ward_id) ?? [];
      list.push(p.id);
      map.set(p.ward_id, list);
    }
  }
  return map;
}

export async function fetchWards(locale: Locale): Promise<FetchResult<Ward[]>> {
  if (!isSupabaseConfigured()) {
    return { data: mockWards, source: "mock" };
  }

  const supabase = await createClient();
  if (!(await isDatabaseSeeded(supabase))) {
    return { data: mockWards, source: "demo" };
  }

  const { data: wardRows, error } = await supabase
    .from("wards")
    .select("*")
    .eq("municipality_slug", municipality.slug)
    .order("number");

  if (error) {
    console.error("[Supabase fetch error]", error);
    return { data: mockWards, source: "demo" };
  }

  const { data: profileRows } = await supabase.from("profiles").select("*");
  const memberMap = await getMemberIdsByWard((profileRows ?? []) as DbProfile[]);

  return {
    data: (wardRows ?? []).map((w) =>
      mapWard(w as DbWard, memberMap.get(w.id) ?? [], locale)
    ),
    source: "supabase",
  };
}

export async function fetchUsers(): Promise<FetchResult<User[]>> {
  if (!isSupabaseConfigured()) {
    return { data: mockUsers, source: "mock" };
  }

  const supabase = await createClient();
  if (!(await isDatabaseSeeded(supabase))) {
    return { data: mockUsers, source: "demo" };
  }

  const { data, error } = await supabase.from("profiles").select("*").order("username");

  if (error) {
    console.error("[Supabase fetch error]", error);
    return { data: mockUsers, source: "demo" };
  }

  return {
    data: ((data ?? []) as DbProfile[]).map(mapProfile),
    source: "supabase",
  };
}

export async function fetchEvents(locale: Locale): Promise<FetchResult<Event[]>> {
  if (!isSupabaseConfigured()) {
    return { data: mockEvents, source: "mock" };
  }

  const supabase = await createClient();
  if (!(await isDatabaseSeeded(supabase))) {
    return { data: mockEvents, source: "demo" };
  }

  const { data: eventRows, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });

  if (error) {
    console.error("[Supabase fetch error]", error);
    return { data: mockEvents, source: "demo" };
  }

  const { data: participants } = await supabase.from("event_participants").select("*");
  const { data: invites } = await supabase.from("event_invites").select("*");

  const participantMap = new Map<string, string[]>();
  const inviteMap = new Map<string, string[]>();

  for (const row of participants ?? []) {
    const list = participantMap.get(row.event_id) ?? [];
    list.push(row.profile_id);
    participantMap.set(row.event_id, list);
  }
  for (const row of invites ?? []) {
    const list = inviteMap.get(row.event_id) ?? [];
    list.push(row.profile_id);
    inviteMap.set(row.event_id, list);
  }

  return {
    data: ((eventRows ?? []) as DbEvent[]).map((e) =>
      mapEvent(e, participantMap.get(e.id) ?? [], inviteMap.get(e.id) ?? [], locale)
    ),
    source: "supabase",
  };
}

export async function fetchPetitions(locale: Locale): Promise<FetchResult<Petition[]>> {
  if (!isSupabaseConfigured()) {
    return { data: mockPetitions, source: "mock" };
  }

  const supabase = await createClient();
  if (!(await isDatabaseSeeded(supabase))) {
    return { data: mockPetitions, source: "demo" };
  }

  const { data, error } = await supabase
    .from("petitions")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("[Supabase fetch error]", error);
    return { data: mockPetitions, source: "demo" };
  }

  return {
    data: ((data ?? []) as DbPetition[]).map((p) => mapPetition(p, locale)),
    source: "supabase",
  };
}
