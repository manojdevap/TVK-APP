import { ForbiddenError, UnauthorizedError } from "@/lib/auth/guard";
import { ConfigError } from "@/lib/config-error";
import { ValidationError } from "@/lib/validation";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; field?: string };

export function failure(error: string, field?: string): ActionResult<never> {
  return { ok: false, error, field };
}

/**
 * Server actions return failures instead of throwing, so a form can put the message
 * next to the field that caused it rather than blowing up the whole page.
 */
export function toFailure(err: unknown): ActionResult<never> {
  if (err instanceof ValidationError) return failure(err.message, err.field);

  // Names the missing setting, never its value — otherwise a fresh deployment fails
  // with a message nobody can act on.
  if (err instanceof ConfigError) {
    console.error("[config]", err.message);
    return failure(`${err.message} Ask an administrator to set it and redeploy.`);
  }
  if (err instanceof UnauthorizedError) return failure(err.message);
  if (err instanceof ForbiddenError) return failure(err.message);

  const message = err instanceof Error ? err.message : String(err);

  if (/duplicate key|unique/i.test(message)) {
    if (/voter_id/i.test(message)) {
      return failure("Another member already has that voter ID", "voterId");
    }
    if (/username/i.test(message)) {
      return failure("That username is already taken", "username");
    }
    if (/slug/i.test(message)) {
      return failure("A role with that name already exists", "nameEn");
    }
    return failure("That value is already used by another record");
  }

  console.error("[action]", err);
  return failure("Something went wrong. Please try again.");
}
