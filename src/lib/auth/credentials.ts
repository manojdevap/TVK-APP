export const MIN_PASSWORD_LENGTH = 8;

/** Returns a message describing what is wrong, or null when the password is acceptable */
export function passwordProblem(password: string): string | null {
  if ((password ?? "").length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;

/**
 * Usernames are typed on a phone keyboard at sign-in, so they stay to lowercase
 * letters, digits and a separator. Sign-in already compares case-insensitively.
 */
export function usernameProblem(username: string): string | null {
  const name = (username ?? "").trim();

  if (name.length < MIN_USERNAME_LENGTH) {
    return `Username must be at least ${MIN_USERNAME_LENGTH} characters`;
  }
  if (name.length > MAX_USERNAME_LENGTH) {
    return `Username must be ${MAX_USERNAME_LENGTH} characters or fewer`;
  }
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name)) {
    return "Username can use lowercase letters, numbers, dot, dash and underscore";
  }
  return null;
}
