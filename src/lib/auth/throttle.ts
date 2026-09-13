import { and, eq, lt, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { loginAttempts } from "@/db/schema";

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 10;

/**
 * Failed sign-ins are counted in Postgres rather than process memory: on Vercel
 * each invocation gets its own memory, so an in-process counter would let an
 * attacker reset the count simply by being routed to a fresh instance.
 */
function key(username: string) {
  return username.trim().toLowerCase();
}

/** Minutes the caller must wait, or 0 when sign-in may proceed */
export async function lockoutMinutes(username: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({
      failures: loginAttempts.failures,
      expiresInMinutes: sql<number>`
        ceil(
          extract(epoch from (${loginAttempts.firstFailureAt} + interval '${sql.raw(String(WINDOW_MINUTES))} minutes' - now())) / 60
        )::int
      `,
    })
    .from(loginAttempts)
    .where(eq(loginAttempts.username, key(username)))
    .limit(1);

  const row = rows[0];
  if (!row) return 0;
  if (row.expiresInMinutes <= 0) return 0;
  if (row.failures < MAX_FAILURES) return 0;

  return Math.max(1, row.expiresInMinutes);
}

export async function recordFailure(username: string): Promise<void> {
  const db = getDb();
  const name = key(username);

  // Restart the window if the previous one has already elapsed.
  await db
    .delete(loginAttempts)
    .where(
      and(
        eq(loginAttempts.username, name),
        lt(
          loginAttempts.firstFailureAt,
          sql`now() - interval '${sql.raw(String(WINDOW_MINUTES))} minutes'`
        )
      )
    );

  await db
    .insert(loginAttempts)
    .values({ username: name, failures: 1 })
    .onConflictDoUpdate({
      target: loginAttempts.username,
      set: { failures: sql`${loginAttempts.failures} + 1` },
    });
}

export async function clearFailures(username: string): Promise<void> {
  const db = getDb();
  await db.delete(loginAttempts).where(eq(loginAttempts.username, key(username)));
}
