/**
 * Image storage — Supabase Storage (free tier: 1 GB)
 *
 * Flow:
 * 1. Admin uploads file via app → server action → Supabase Storage bucket
 * 2. Storage returns public URL
 * 3. URL saved in Postgres column (avatar_url / photos[])
 *
 * Buckets (create in Supabase Dashboard or run supabase/storage.sql):
 * - profile-photos   → profiles.avatar_url
 * - event-photos     → events.photos[]
 * - petition-photos  → petitions.photos[]
 */
export const storageBuckets = {
  profiles: "profile-photos",
  events: "event-photos",
  petitions: "petition-photos",
} as const;

export type StorageBucket = (typeof storageBuckets)[keyof typeof storageBuckets];

/** Max upload size per file (bytes) — keep reasonable for free tier */
export const maxUploadBytes = 5 * 1024 * 1024; // 5 MB

export const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
