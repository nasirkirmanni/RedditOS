import { NextResponse } from "next/server";
import { isSupabaseConfigured, getServiceKey } from "@/lib/supabase";

// Connectivity check that works before any tables exist: hits the PostgREST
// root with the service key and reports whether Supabase accepts it.
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        message: process.env.NEXT_PUBLIC_SUPABASE_URL
          ? "URL found, but SUPABASE_SECRET_KEY is missing from .env.local. Copy it from Dashboard → Settings → API keys (sb_secret_...) — the publishable key alone cannot read or write data."
          : "Missing env vars. Copy .env.example to .env.local and fill in your Supabase URL and keys, then restart the dev server.",
      },
      { status: 503 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = getServiceKey();
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          status: res.status,
          message:
            res.status === 401 || res.status === 403
              ? "Supabase rejected the key — double-check SUPABASE_SERVICE_ROLE_KEY."
              : `Supabase responded with ${res.status}.`,
        },
        { status: 502 }
      );
    }
    return NextResponse.json({
      ok: true,
      configured: true,
      message: "Connected to Supabase.",
      project: new URL(url).hostname.split(".")[0],
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message: `Could not reach Supabase: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 502 }
    );
  }
}
