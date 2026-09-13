/**
 * Seed reference data: ward 1..N and the default party positions.
 *
 *   npm run db:seed
 *
 * Safe to re-run — it inserts only what is missing and never overwrites edits.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "../src/db/schema.ts";

const WARD_COUNT = 30;

const DEFAULT_ROLES = [
  {
    slug: "organiser",
    nameEn: "Organiser",
    nameTa: "ஒருங்கிணைப்பாளர்",
    maxPerWard: 1,
    sortOrder: 10,
    isSystem: true,
  },
  {
    slug: "associate_organiser",
    nameEn: "Associate Organiser",
    nameTa: "இணை ஒருங்கிணைப்பாளர்",
    maxPerWard: null,
    sortOrder: 20,
    isSystem: true,
  },
  {
    slug: "member",
    nameEn: "Member",
    nameTa: "உறுப்பினர்",
    maxPerWard: null,
    sortOrder: 90,
    isSystem: true,
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set — add it to .env.local");

  const db = drizzle(neon(url), { schema });

  const wardRows = Array.from({ length: WARD_COUNT }, (_, i) => ({ number: i + 1 }));
  await db.insert(schema.wards).values(wardRows).onConflictDoNothing();

  await db
    .insert(schema.roles)
    .values(DEFAULT_ROLES)
    .onConflictDoNothing({ target: schema.roles.slug });

  const [{ wards: wardCount }] = await db
    .select({ wards: sql<number>`count(*)::int` })
    .from(schema.wards);
  const [{ roles: roleCount }] = await db
    .select({ roles: sql<number>`count(*)::int` })
    .from(schema.roles);

  console.log(`\n✔ Seeded. ${wardCount} wards, ${roleCount} roles.\n`);
}

main().catch((err) => {
  console.error(`\n✖ ${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
});
