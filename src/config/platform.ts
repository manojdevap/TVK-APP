import { municipality } from "./municipality";

/**
 * Zero-cost stack:
 * - Frontend: Next.js on Vercel (free)
 * - Backend: Supabase BaaS (free tier — Postgres, Auth, Storage)
 * - Auth: Email OTP / magic link via Supabase Auth (free)
 * - Photos: Supabase Storage bucket event-photos (free 1GB)
 */
export const platform = {
  municipality,
  backend: {
    provider: "supabase" as const,
    dashboard: "https://supabase.com/dashboard",
    features: ["postgres", "auth", "storage", "rls"],
  },
  auth: {
    methods: ["email_otp", "google"] as const,
    note: "Supabase Auth — email OTP is free; enable Google provider in Supabase dashboard if needed",
  },
  voterImport: {
    format: "csv",
    requiredColumns: [
      "username",
      "address",
      "voterId",
      "wardNumber",
      "gender",
      "isOurVote",
    ],
    optionalColumns: ["role", "phone"],
  },
  petitionFlow: ["submitted", "in_progress", "resolved", "rejected"] as const,
} as const;
