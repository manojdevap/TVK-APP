export const MIN_PASSWORD_LENGTH = 8;

/** Returns a message describing what is wrong, or null when the password is acceptable */
export function passwordProblem(password: string): string | null {
  if ((password ?? "").length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}
