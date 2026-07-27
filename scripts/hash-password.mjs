#!/usr/bin/env node
// Generates AUTH_PASSWORD_HASH (and AUTH_SECRET on request) for .env.local.
// The plaintext password is never written anywhere - only its scrypt hash.
//
//   node scripts/hash-password.mjs "my new password"
//   node scripts/hash-password.mjs "my new password" --write   (updates .env.local)
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scryptAsync = promisify(scrypt);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env.local");

const args = process.argv.slice(2);
const write = args.includes("--write");
const password = args.find((a) => !a.startsWith("--"));

if (!password) {
  console.error(`
Usage: node scripts/hash-password.mjs "<password>" [--write]

  --write   update AUTH_* values in .env.local in place
`);
  process.exit(1);
}

const salt = randomBytes(16);
const key = await scryptAsync(password, salt, 64);
// Colon-separated: dotenv expands `$name`, which would corrupt the value.
const hash = `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;

if (!write) {
  console.log("\nAUTH_PASSWORD_HASH=" + hash + "\n");
  console.log("Add that to .env.local and to your Vercel environment variables.");
  process.exit(0);
}

let contents = existsSync(envFile) ? readFileSync(envFile, "utf8") : "";
const secret = /^AUTH_SECRET=.+$/m.test(contents)
  ? null
  : randomBytes(32).toString("base64url");

const setVar = (text, key_, value) =>
  new RegExp(`^${key_}=.*$`, "m").test(text)
    ? text.replace(new RegExp(`^${key_}=.*$`, "m"), `${key_}=${value}`)
    : text.replace(/\s*$/, "\n") + `${key_}=${value}\n`;

contents = setVar(contents, "AUTH_PASSWORD_HASH", hash);
if (secret) contents = setVar(contents, "AUTH_SECRET", secret);
writeFileSync(envFile, contents);

console.log("Updated .env.local:");
console.log("  AUTH_PASSWORD_HASH  (new hash written)");
if (secret) console.log("  AUTH_SECRET         (generated)");
console.log("\nRestart the dev server. Remember to update Vercel too.");
