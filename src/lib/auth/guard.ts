import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { readSession, type Session } from "@/lib/auth/session";

export class UnauthorizedError extends Error {
  constructor(message = "You are not signed in") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Only an admin can do that") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function getSession(): Promise<Session | null> {
  return readSession();
}

export async function requireSession(): Promise<Session> {
  const session = await readSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

/**
 * Every write in this release goes through here. Admin is a flag on the account,
 * never a party role — so adding a role can never grant write access.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (!session.isAdmin) throw new ForbiddenError();
  return session;
}

/**
 * Account management sits above ordinary admin: only a super admin may create a
 * login, issue a password or grant admin to someone else.
 *
 * Unlike `isAdmin`, this is read from the database rather than the session token.
 * A token lasts thirty days, so a claim inside it would keep working for a month
 * after the tier was taken away — and would be missing entirely from a token issued
 * before the tier existed.
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await readSession();
  if (!session) return false;

  const db = getDb();
  const [row] = await db
    .select({ isSuperAdmin: users.isSuperAdmin })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return row?.isSuperAdmin === true;
}

export async function requireSuperAdmin(): Promise<Session> {
  const session = await requireSession();
  if (!(await isSuperAdmin())) {
    throw new ForbiddenError("Only a super admin can manage accounts");
  }
  return session;
}
