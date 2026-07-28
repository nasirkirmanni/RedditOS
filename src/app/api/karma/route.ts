import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { insertSnapshot } from "@/lib/repos/karma";
import { listAccounts } from "@/lib/repos/accounts";
import { zonedEpoch, todayDateString } from "@/lib/date";

/**
 * Record karma totals for one or more accounts on a date.
 *
 * Karma is a running total, so each entry is a snapshot: the charts read the
 * latest value per day. Accounts left blank are skipped rather than zeroed.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const date = String(body.date ?? todayDateString());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const raw = Array.isArray(body.entries) ? body.entries : [];
  if (!raw.length) {
    return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
  }

  const known = new Set((await listAccounts()).map((a) => a.id));
  const entries: { account_id: number; total_karma: number }[] = [];

  for (const e of raw) {
    const id = Number(e?.account_id);
    if (!known.has(id)) {
      return NextResponse.json(
        { error: `Unknown account (${e?.account_id})` },
        { status: 400 }
      );
    }
    // Blank means "no reading for this account", not zero.
    if (e?.total_karma === "" || e?.total_karma == null) continue;
    const karma = Number(e.total_karma);
    if (!Number.isFinite(karma) || karma < 0 || !Number.isInteger(karma)) {
      return NextResponse.json(
        { error: `Karma must be a whole number of 0 or more` },
        { status: 400 }
      );
    }
    entries.push({ account_id: id, total_karma: karma });
  }

  if (!entries.length) {
    return NextResponse.json(
      { error: "Enter a karma total for at least one account" },
      { status: 400 }
    );
  }

  const takenAt = zonedEpoch(date, 12);
  try {
    for (const e of entries) {
      await insertSnapshot({
        account_id: e.account_id,
        link_karma: 0,
        comment_karma: 0,
        total_karma: e.total_karma,
        taken_at: takenAt,
      });
    }
    for (const p of ["/", "/accounts"]) revalidatePath(p);
    return NextResponse.json({ saved: entries.length, date }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
