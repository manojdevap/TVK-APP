/**
 * A deployment is missing something it needs — an environment variable, usually.
 *
 * This is kept distinct from ordinary failures so the app can say which setting is
 * missing instead of showing "something went wrong". Nobody can act on the generic
 * message, and on a fresh deploy a missing variable is the likeliest cause of all.
 *
 * The message names the variable but never its value, so it is safe to show.
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}
