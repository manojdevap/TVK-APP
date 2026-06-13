"use server";

import { isAdminUser } from "@/lib/auth/admin";
import { municipality } from "@/config/municipality";
import type { CsvVoterRow } from "@/lib/csv-voters";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function adminClient() {
  if (!(await isAdminUser())) throw new Error("Unauthorized");
  if (hasServiceRole()) return createServiceClient();
  return createClient();
}

export async function importVotersToDb(
  rows: CsvVoterRow[],
  wardNumberToId: Record<number, string>
) {
  const supabase = await adminClient();
  const map = new Map(Object.entries(wardNumberToId).map(([k, v]) => [Number(k), v]));

  const payloads = rows.map((row) => {
    const ward_id = map.get(row.wardNumber);
    if (!ward_id) throw new Error(`Ward ${row.wardNumber} not found`);
    return {
      username: row.username,
      address: row.address,
      voter_id: row.voterId,
      ward_id,
      gender: row.gender,
      is_our_vote: row.isOurVote,
      role: row.role ?? "ward_member",
      phone: row.phone ?? null,
    };
  });

  const { error } = await supabase.from("profiles").upsert(payloads, {
    onConflict: "voter_id",
  });
  if (error) throw error;
  return payloads.length;
}

export const wardInsertDefaults = {
  municipality_slug: municipality.slug,
};
