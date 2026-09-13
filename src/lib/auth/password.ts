import bcrypt from "bcryptjs";

const ROUNDS = 10;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, ROUNDS);
}

export function verifyPassword(password: string, hash: string | null | undefined): boolean {
  if (!hash) return false;
  return bcrypt.compareSync(password, hash);
}
