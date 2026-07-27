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

/** Constant-time check of a password against a stored hash. */
export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [scheme, saltHex, hashHex] = (stored ?? "").split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  try {
    const key = await scryptAsync(password, Buffer.from(saltHex, "hex"), KEYLEN);
    const expected = Buffer.from(hashHex, "hex");
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}
