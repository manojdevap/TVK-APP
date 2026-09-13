"use server";

import { requireSession } from "@/lib/auth/guard";
import { listMembersForPicker } from "./queries";

export type OrganiserOption = { id: string; fullName: string; wardNumber: number };

/**
 * Candidates for the organiser picker, reloaded whenever the ward or the typed name
 * changes. A party-wide event has no ward to narrow by, so a name is required.
 */
export async function listOrganiserOptions(options: {
  wardId?: string;
  query?: string;
}): Promise<OrganiserOption[]> {
  await requireSession();

  const rows = await listMembersForPicker({
    wardId: options.wardId || undefined,
    query: options.query || undefined,
  });

  return rows.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    wardNumber: row.wardNumber,
  }));
}
