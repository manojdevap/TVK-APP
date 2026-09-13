/**
 * Move photos uploaded during local development into Vercel Blob.
 *
 *   npm run migrate-photos
 *
 * Development writes to public/uploads, which is not part of the repository and does
 * not exist on a server — so those rows point at files a deployment cannot serve.
 * This uploads each one and rewrites the row to the new URL.
 *
 * Safe to re-run: rows already pointing at blob storage are skipped, and a row is
 * only rewritten after its upload succeeds.
 */
import { put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const sql = neon(requireEnv("DATABASE_URL"));

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set — add it to .env.local`);
  return value;
}

type Target = {
  label: string;
  url: string;
  /** Writes the new URL back to whichever table the row came from */
  update: (next: string) => Promise<unknown>;
};

async function collect(): Promise<Target[]> {
  const targets: Target[] = [];

  for (const row of await sql`select id, full_name, photo_url from members where photo_url like '/uploads/%'`) {
    targets.push({
      label: `member ${row.full_name}`,
      url: row.photo_url,
      update: (next) => sql`update members set photo_url = ${next} where id = ${row.id}`,
    });
  }

  for (const row of await sql`select id, title, banner_url from events where banner_url like '/uploads/%'`) {
    targets.push({
      label: `event banner "${row.title}"`,
      url: row.banner_url,
      update: (next) => sql`update events set banner_url = ${next} where id = ${row.id}`,
    });
  }

  for (const row of await sql`select id, url from event_photos where url like '/uploads/%'`) {
    targets.push({
      label: `event photo`,
      url: row.url,
      update: (next) => sql`update event_photos set url = ${next} where id = ${row.id}`,
    });
  }

  for (const row of await sql`select id, url from petition_photos where url like '/uploads/%'`) {
    targets.push({
      label: `petition photo`,
      url: row.url,
      update: (next) => sql`update petition_photos set url = ${next} where id = ${row.id}`,
    });
  }

  return targets;
}

async function main() {
  requireEnv("BLOB_READ_WRITE_TOKEN");

  const targets = await collect();
  if (!targets.length) {
    console.log("\nNothing to move — no photo still points at a local file.\n");
    return;
  }

  console.log(`\nMoving ${targets.length} photo(s) into blob storage.\n`);

  let moved = 0;
  let missing = 0;

  for (const target of targets) {
    // The stored URL is "/uploads/<folder>/<file>", served from public/
    const absolute = path.join(process.cwd(), "public", target.url.replace(/^\//, ""));

    let bytes: Buffer;
    try {
      bytes = await fs.readFile(absolute);
    } catch {
      missing++;
      console.log(`  SKIP  ${target.label} — no file at ${target.url}`);
      continue;
    }

    const name = target.url.replace(/^\/uploads\//, "");
    const blob = await put(name, bytes, {
      access: "public",
      contentType: "image/jpeg",
      cacheControlMaxAge: 31536000,
    });

    // Only once the upload succeeded, so a failure never leaves a dangling row.
    await target.update(blob.url);
    moved++;
    console.log(`  MOVED ${target.label}`);
  }

  console.log(`\n✔ ${moved} moved${missing ? `, ${missing} skipped (file not found)` : ""}.`);
  console.log("The files under public/uploads are no longer referenced and can be deleted.\n");
}

main().catch((err) => {
  console.error(`\n✖ ${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
});
