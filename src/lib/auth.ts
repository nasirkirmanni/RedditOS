// Session tokens for the single-user login.
//
// Uses Web Crypto only, so the same code runs in middleware (edge) and in
// route handlers (node). The token is a signed payload, not encryption - it
// carries no secret, just the username and an expiry, signed with AUTH_SECRET
// so it cannot be forged or extended.

export const SESSION_COOKIE = "redditos_session";
const SESSION_DAYS = 30;

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Create a signed session token for a username. */
export async function createSession(
  username: string,
  secret: string
): Promise<string> {
  const payload = JSON.stringify({
    u: username,
    exp: Date.now() + SESSION_DAYS * 86400_000,
  });
  const body = b64urlEncode(new TextEncoder().encode(payload));
  const sig = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    new TextEncoder().encode(body)
  );
  return `${body}.${b64urlEncode(new Uint8Array(sig))}`;
}

/** Verify a token; returns the username, or null when invalid or expired. */
export async function verifySession(
  token: string | undefined,
  secret: string
): Promise<string | null> {
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  let valid: boolean;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      b64urlDecode(sig),
      new TextEncoder().encode(body)
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const data = JSON.parse(new TextDecoder().decode(b64urlDecode(body)));
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return typeof data.u === "string" ? data.u : null;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_DAYS * 86400;
