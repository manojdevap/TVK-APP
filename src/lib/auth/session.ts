import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "tvk_session";
const SESSION_DAYS = 30;
const DEV_SECRET = "tvk-ward-tracker-development-secret-not-for-production";

export type Session = {
  userId: string;
  username: string;
  isAdmin: boolean;
  mustChangePassword: boolean;
};

function secretKey() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET must be at least 32 characters in production. " +
          'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64\'))"'
      );
    }
    return new TextEncoder().encode(secret || DEV_SECRET);
  }

  return new TextEncoder().encode(secret);
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.userId !== "string" || typeof payload.username !== "string") {
      return null;
    }
    return {
      userId: payload.userId,
      username: payload.username,
      isAdmin: payload.isAdmin === true,
      mustChangePassword: payload.mustChangePassword === true,
    };
  } catch {
    return null;
  }
}

export async function setSession(session: Session) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function readSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}
