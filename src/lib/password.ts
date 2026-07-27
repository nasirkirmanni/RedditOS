// Password hashing (scrypt). Node runtime only - imported by the login route
// and the hash-password script, never by middleware.
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

const KEYLEN = 64;

/**
 * Produce a `scrypt:<salt>:<hash>` string safe to store in an env var.
 * Colons, not `$` - dotenv expands `$name` and would mangle the value.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEYLEN);
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}

const HEX = /^[0-9a-f]+$/i;

/**
 * Split a stored hash into salt and digest.
 *
 * Accepts `scrypt:<salt>:<digest>` and the bare `<salt>:<digest>`. The scheme
 * is only a label, and copying these long values by hand loses it easily -
 * there is no reason to reject an otherwise valid pair over a missing prefix.
 */
function parseStored(stored: string): { salt: string; digest: string } | null {
  const parts = (stored ?? "").trim().split(":");
  const [salt, digest] =
    parts.length === 3 && parts[0].toLowerCase() === "scrypt"
      ? [parts[1], parts[2]]
      : parts.length === 2
        ? [parts[0], parts[1]]
        : [null, null];

  if (!salt || !digest) return null;
  if (!HEX.test(salt) || !HEX.test(digest)) return null;
  if (digest.length !== KEYLEN * 2) return null;
  return { salt, digest };
}

/** Constant-time check of a password against a stored hash. */
export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parsed = parseStored(stored);
  if (!parsed) return false;
  const { salt: saltHex, digest: hashHex } = parsed;
  try {
    const key = await scryptAsync(password, Buffer.from(saltHex, "hex"), KEYLEN);
    const expected = Buffer.from(hashHex, "hex");
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}
