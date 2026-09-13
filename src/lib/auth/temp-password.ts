/**
 * A password a super admin can read out over the phone or paste into WhatsApp.
 *
 * The alphabet leaves out characters that look alike in a message — no 0/O, 1/l/i —
 * because the person receiving it will be typing it by hand, once. It is grouped in
 * fours for the same reason. The account is flagged `mustChangePassword`, so this
 * value only has to survive one sign-in.
 */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const GROUPS = 3;
const GROUP_SIZE = 4;

/** Rejection sampling — plain modulo would make the first few letters likelier */
function pick(): string {
  const limit = 256 - (256 % ALPHABET.length);
  const byte = new Uint8Array(1);

  for (;;) {
    crypto.getRandomValues(byte);
    if (byte[0] < limit) return ALPHABET[byte[0] % ALPHABET.length];
  }
}

export function generateTempPassword(): string {
  return Array.from({ length: GROUPS }, () =>
    Array.from({ length: GROUP_SIZE }, pick).join("")
  ).join("-");
}
