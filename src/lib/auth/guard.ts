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
