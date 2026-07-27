import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/password";
import { createSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export const runtime = "nodejs";

// Small in-memory throttle. Enough to make guessing impractical on a
// single-user app; resets when the server restarts.
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 8;
const LOCKOUT_MS = 5 * 60_000;

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const record = attempts.get(ip);
  if (record && record.until > now && record.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const { username, password } = await req.json().catch(() => ({}));

  const expectedUser = process.env.AUTH_USERNAME;
  const expectedHash = process.env.AUTH_PASSWORD_HASH;
  const secret = process.env.AUTH_SECRET;
  if (!expectedUser || !expectedHash || !secret) {
    return NextResponse.json(
      {
        error:
          "Login is not configured on the server (AUTH_USERNAME, AUTH_PASSWORD_HASH, AUTH_SECRET).",
      },
      { status: 500 }
    );
  }

  const userOk =
    typeof username === "string" &&
    username.trim().toLowerCase() === expectedUser.toLowerCase();
  const passOk =
    typeof password === "string" && (await verifyPassword(password, expectedHash));

  if (!userOk || !passOk) {
    const next = record && record.until > now ? record.count + 1 : 1;
    attempts.set(ip, { count: next, until: now + LOCKOUT_MS });
    // Same message either way - don't reveal which field was wrong.
    return NextResponse.json(
      { error: "Incorrect username or password." },
      { status: 401 }
    );
  }

  attempts.delete(ip);
  const token = await createSession(expectedUser, secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
