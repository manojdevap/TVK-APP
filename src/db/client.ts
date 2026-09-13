import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { ConfigError } from "@/lib/config-error";

/**
 * One Neon HTTP connection per serverless invocation.
 *
 * The HTTP driver issues one request per query, so there is no pool to exhaust
 * and nothing to keep warm between invocations — which is what makes it safe on
 * Vercel, where a long-lived TCP pool would leak connections.
 */
function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new ConfigError("DATABASE_URL is not set on the server.");
  }
  return url;
}

const globalForDb = globalThis as unknown as {
  __wardDb?: ReturnType<typeof createDb>;
};

function createDb() {
  return drizzle(neon(connectionString()), { schema });
}

export function getDb() {
  return (globalForDb.__wardDb ??= createDb());
}

export type Db = ReturnType<typeof getDb>;
export { schema };
