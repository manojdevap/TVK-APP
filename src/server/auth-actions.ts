"use server";

import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { passwordProblem } from "@/lib/auth/credentials";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearSession, setSession } from "@/lib/auth/session";
import { clearFailures, lockoutMinutes, recordFailure } from "@/lib/auth/throttle";
import { requireSession } from "@/lib/auth/guard";
import { toFailure, failure, type ActionResult } from "./action-result";

export type SignInResult = ActionResult<{ mustChangePassword: boolean }>;

export async function signIn(username: string, password: string): Promise<SignInResult> {
  try {
    const name = (username ?? "").trim();
    if (!name || !password) return failure("Enter your username and password");

    const waitMinutes = await lockoutMinutes(name);
    if (waitMinutes > 0) {
      return failure(`Too many failed attempts. Try again in ${waitMinutes} minute(s).`);
    }

    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.username}) = lower(${name})`)
      .limit(1);

    // Same message either way, so the form never reveals which usernames exist.
    if (!user || !verifyPassword(password, user.passwordHash)) {
      await recordFailure(name);
      return failure("Incorrect username or password");
    }

    await clearFailures(name);
    await setSession({
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      mustChangePassword: user.mustChangePassword,
    });

    return { ok: true, data: { mustChangePassword: user.mustChangePassword } };
  } catch (err) {
    return toFailure(err);
  }
}

export async function signOut(): Promise<void> {
  await clearSession();
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ActionResult> {
  try {
    const session = await requireSession();

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user) return failure("Your account no longer exists");

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return failure("Current password is incorrect", "currentPassword");
    }
    if (currentPassword === newPassword) {
      return failure("Choose a password different from your current one", "newPassword");
    }

    const problem = passwordProblem(newPassword);
    if (problem) return failure(problem, "newPassword");

    await db
      .update(users)
      .set({ passwordHash: hashPassword(newPassword), mustChangePassword: false })
      .where(eq(users.id, user.id));

    await setSession({
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      mustChangePassword: false,
    });

    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}

