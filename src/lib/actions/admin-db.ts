"use server";

import { municipality } from "@/config/municipality";
import { ensureWardSlots } from "@/lib/data/ensure-wards";
import { storageBuckets, type StorageBucket } from "@/config/storage";
import { isAdminUser } from "@/lib/auth/admin";
import { wardInsertDefaults } from "@/lib/data/admin-mutations";
import { uploadImage } from "@/lib/storage/upload";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";

async function adminClient() {
  if (!(await isAdminUser())) {
    throw new Error("Unauthorized");
  }
  if (hasServiceRole()) {
    return createServiceClient();
  }
  return createClient();
}

/** Prefer service role for ward seeding (RLS insert requires Supabase admin auth) */
function wardEnsureClient() {
  if (hasServiceRole()) {
    return createServiceClient();
  }
  return null;
}

export async function adminListWards() {
  const supabase = await adminClient();
  const ensureClient = wardEnsureClient() ?? supabase;
  try {
    await ensureWardSlots(ensureClient);
  } catch (err) {
    console.error("[ensureWardSlots]", err);
  }
  const { data, error } = await supabase
    .from("wards")
    .select("*")
    .eq("municipality_slug", municipality.slug)
    .order("number");
  if (error) throw error;
  return data ?? [];
}

export async function adminUpsertWard(
  payload: Record<string, unknown>,
  id?: string
) {
  const supabase = await adminClient();
  const row = { ...payload, ...wardInsertDefaults };
  if (id) {
    const { error } = await supabase.from("wards").update(row).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("wards").insert(row);
    if (error) throw error;
  }
}

export async function adminDeleteWard(id: string) {
  const supabase = await adminClient();
  const { error } = await supabase.from("wards").delete().eq("id", id);
  if (error) throw error;
}

export async function adminListProfiles() {
  const supabase = await adminClient();
  const { data, error } = await supabase.from("profiles").select("*").order("username");
  if (error) throw error;
  return data ?? [];
}

export async function adminUpsertProfile(payload: Record<string, unknown>, id?: string) {
  const supabase = await adminClient();
  if (id) {
    const { error } = await supabase.from("profiles").update(payload).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("profiles").insert(payload);
    if (error) throw error;
  }
}

export async function adminDeleteProfile(id: string) {
  const supabase = await adminClient();
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw error;
}

export async function adminListEvents() {
  const supabase = await adminClient();
  const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function adminInsertEvent(payload: Record<string, unknown>) {
  const supabase = await adminClient();
  const { error } = await supabase.from("events").insert(payload);
  if (error) throw error;
}

export async function adminUpdateEventPhotos(id: string, photos: string[]) {
  const supabase = await adminClient();
  const { error } = await supabase.from("events").update({ photos }).eq("id", id);
  if (error) throw error;
}

export async function adminDeleteEvent(id: string) {
  const supabase = await adminClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

export async function adminListPetitions() {
  const supabase = await adminClient();
  const { data, error } = await supabase.from("petitions").select("*").order("submitted_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function adminInsertPetition(payload: Record<string, unknown>) {
  const supabase = await adminClient();
  const { error } = await supabase.from("petitions").insert(payload);
  if (error) throw error;
}

export async function adminUpdatePetitionStatus(id: string, status: string) {
  const supabase = await adminClient();
  const { error } = await supabase.from("petitions").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function adminUpdatePetitionPhotos(id: string, photos: string[]) {
  const supabase = await adminClient();
  const { error } = await supabase.from("petitions").update({ photos }).eq("id", id);
  if (error) throw error;
}

export async function adminDeletePetition(id: string) {
  const supabase = await adminClient();
  const { error } = await supabase.from("petitions").delete().eq("id", id);
  if (error) throw error;
}

async function adminUploadImage(bucket: StorageBucket, file: File, folder: string) {
  if (!(await isAdminUser())) throw new Error("Unauthorized");
  return uploadImage(bucket, file, folder);
}

export async function adminUploadEventPhoto(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file");
  return adminUploadImage(storageBuckets.events, file, "events");
}

export async function adminUploadProfilePhoto(profileId: string, formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file");
  const url = await adminUploadImage(storageBuckets.profiles, file, profileId);
  const supabase = await adminClient();
  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", profileId);
  if (error) throw error;
  return url;
}

export async function adminUploadPetitionPhoto(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file");
  return adminUploadImage(storageBuckets.petitions, file, "petitions");
}
