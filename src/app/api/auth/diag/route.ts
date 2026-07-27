import { NextResponse } from "next/server";

// TEMPORARY diagnostic for env-var setup. Reports only shapes and lengths -
// never the values. Gated by a fixed token so it is not casually probeable.
// Delete this file once login is confirmed working.
export const runtime = "nodejs";

const TOKEN = "diag-8f3a1c";

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("t") !== TOKEN) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = process.env.AUTH_USERNAME;
  const hash = process.env.AUTH_PASSWORD_HASH;
  const secret = process.env.AUTH_SECRET;
  const parts = (hash ?? "").split(":");

  return NextResponse.json({
    AUTH_USERNAME: {
      set: Boolean(user),
      length: user?.length ?? 0,
      value: user ?? null, // not a secret
      hasWhitespace: user ? user !== user.trim() : false,
    },
    AUTH_PASSWORD_HASH: {
      set: Boolean(hash),
      length: hash?.length ?? 0,
      expectedLength: 168,
      scheme: parts[0] ?? null,
      partCount: parts.length,
      saltLength: parts[1]?.length ?? 0, // expect 32
      hashLength: parts[2]?.length ?? 0, // expect 128
      hasWhitespace: hash ? hash !== hash.trim() : false,
      // The salt is not secret - it is stored beside the hash by design.
      salt: parts[1] ?? null,
      digestPrefix: parts[2]?.slice(0, 16) ?? null,
    },
    AUTH_SECRET: {
      set: Boolean(secret),
      length: secret?.length ?? 0,
      expectedLength: 43,
      hasWhitespace: secret ? secret !== secret.trim() : false,
    },
  });
}
