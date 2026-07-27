import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { trackAllAccounts } from "@/lib/services/tracker";

// Invoked on a schedule by Vercel Cron (see vercel.json). Runs the karma bot
// from the deployment's network, which is not subject to the local block.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when the env var is set.
  if (!secret) return true; // no secret configured: allow (local/dev)
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const results = await trackAllAccounts();
  const failed = results.filter((r) => !r.ok);

  revalidatePath("/");
  revalidatePath("/accounts");

  return NextResponse.json({
    ran_at: new Date().toISOString(),
    duration_ms: Date.now() - started,
    checked: results.length,
    succeeded: results.length - failed.length,
    failed: failed.length,
    errors: failed.map((f) => ({ username: f.username, error: f.error })),
  });
}
