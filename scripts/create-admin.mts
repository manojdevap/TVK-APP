/**
 * Create or reset a super admin account.
 *
 *   npm run create-admin -- <username>
 *
 * A super admin can create every other account from inside the app, so this command
 * only has to be run once when setting the app up — and again if the super admin is
 * ever locked out.
 *
 * Prompts for the password without echoing it, so it never reaches shell history.
 * This is also the recovery path if nobody can sign in — there is no email reset,
 * because the app holds no email addresses.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import process from "node:process";
import * as schema from "../src/db/schema.ts";

const MIN_PASSWORD_LENGTH = 8;
const ETX = String.fromCharCode(3);
const EOT = String.fromCharCode(4);
const DEL = String.fromCharCode(127);

function askHidden(prompt: string): Promise<string> {
  const stdin = process.stdin;

  if (!stdin.isTTY) {
    return new Promise((resolve) => {
      let buffer = "";
      stdin.setEncoding("utf8");
      stdin.on("data", (chunk) => {
        buffer += chunk;
      });
      stdin.on("end", () => resolve(buffer.split(/\r?\n/)[0]));
    });
  }

  return new Promise((resolve) => {
    process.stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";
    const finish = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      process.stdout.write("\n");
    };

    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n" || char === EOT) {
          finish();
          resolve(value);
          return;
        }
        if (char === ETX) {
          finish();
          process.exit(130);
        }
        if (char === DEL || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += char;
      }
    };

    stdin.on("data", onData);
  });
}

async function main() {
  const username = process.argv[2]?.trim();
  if (!username) throw new Error("Usage: npm run create-admin -- <username>");

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set — add it to .env.local");

  const db = drizzle(neon(url), { schema });

  const existing = await db
    .select({ id: schema.users.id, username: schema.users.username })
    .from(schema.users)
    .where(sql`lower(${schema.users.username}) = lower(${username})`)
    .limit(1);

  const action = existing.length ? "Resetting password for" : "Creating super admin";
  console.log(`\n${action} "${username}".`);

  const password = await askHidden("Password: ");
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (process.stdin.isTTY) {
    const again = await askHidden("Confirm password: ");
    if (again !== password) throw new Error("Passwords do not match.");
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  if (existing.length) {
    await db
      .update(schema.users)
      .set({ passwordHash, isAdmin: true, isSuperAdmin: true, mustChangePassword: false })
      .where(eq(schema.users.id, existing[0].id));
  } else {
    await db.insert(schema.users).values({
      username,
      displayName: username,
      passwordHash,
      isAdmin: true,
      isSuperAdmin: true,
      mustChangePassword: false,
    });
  }

  console.log(`\n✔ Done. Sign in as "${username}".\n`);
}

main().catch((err) => {
  console.error(`\n✖ ${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
});
