"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { loginAttempts, users } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";
import { generateTempPassword } from "@/lib/auth/temp-password";
import { usernameProblem } from "@/lib/auth/credentials";
import { requireText, requireUuid, ValidationError } from "@/lib/validation";
import { toFailure, type ActionResult } from "./action-result";

export type AccountInput = {
  username: string;
  displayName: string;
  /** Whether this account may add and edit wards, members, events and petitions */
  isAdmin: boolean;
};

/**
 * The one moment the password is readable. It is returned to the super admin who
 * created it so they can pass it on, and never stored anywhere but as a hash.
 */
export type IssuedPassword = { username: string; displayName: string; password: string };

function parse(input: AccountInput) {
  const username = (input.username ?? "").trim().toLowerCase();
  const problem = usernameProblem(username);
  if (problem) throw new ValidationError("username", problem);

  return {
    username,
    displayName: requireText(input.displayName, "displayName", "Name", 80),
    isAdmin: input.isAdmin === true,
  };
}

/**
 * Reads the account being acted on and refuses if it is a super admin.
 *
 * A super admin is made from the server with `npm run create-admin`, never through
 * the app. That keeps the top of the ladder off a screen anyone signs in to, and it
 * is also why nobody can demote or delete themselves here by accident.
 */
async function loadTarget(id: string) {
  const userId = requireUuid(id, "id", "Account");
  const db = getDb();

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      isSuperAdmin: users.isSuperAdmin,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new ValidationError("id", "That account no longer exists");
  if (user.isSuperAdmin) {
    throw new ValidationError(
      "id",
      "A super admin account can only be changed from the server."
    );
  }
  return user;
}

export async function createAccount(input: AccountInput): Promise<ActionResult<IssuedPassword>> {
  try {
    await requireSuperAdmin();
    const values = parse(input);

    const password = generateTempPassword();
    const db = getDb();

    await db.insert(users).values({
      ...values,
      passwordHash: hashPassword(password),
      isSuperAdmin: false,
      // They sign in with what you give them, then pick their own.
      mustChangePassword: true,
    });

    revalidatePath("/", "layout");
    return {
      ok: true,
      data: { username: values.username, displayName: values.displayName, password },
    };
  } catch (err) {
    return toFailure(err);
  }
}

/** Used when someone forgets their password — there is no email to reset through */
export async function resetAccountPassword(id: string): Promise<ActionResult<IssuedPassword>> {
  try {
    await requireSuperAdmin();
    const target = await loadTarget(id);

    const password = generateTempPassword();
    const db = getDb();

    await db
      .update(users)
      .set({ passwordHash: hashPassword(password), mustChangePassword: true })
      .where(eq(users.id, target.id));

    // Otherwise the failed attempts that led to the reset keep them locked out.
    await db.delete(loginAttempts).where(sql`lower(${loginAttempts.username}) = ${target.username}`);

    revalidatePath("/", "layout");
    return {
      ok: true,
      data: { username: target.username, displayName: target.displayName, password },
    };
  } catch (err) {
    return toFailure(err);
  }
}

export async function setAccountAdmin(id: string, isAdmin: boolean): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    const target = await loadTarget(id);

    const db = getDb();
    await db.update(users).set({ isAdmin: isAdmin === true }).where(eq(users.id, target.id));

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    const target = await loadTarget(id);

    const db = getDb();
    await db.delete(users).where(eq(users.id, target.id));
    await db.delete(loginAttempts).where(sql`lower(${loginAttempts.username}) = ${target.username}`);

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}
