import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  listDailyActivity,
  upsertDailyActivity,
} from "@/lib/repos/dailyActivity";
import { getAccountById } from "@/lib/repos/accounts";
import { insertSnapshot } from "@/lib/repos/karma";

export async function GET() {
  return NextResponse.json(await listDailyActivity());
}

export async function POST(req: Request) {
  const body = await req.json();

  const accountId = Number(body.account_id);
  if (!Number.isInteger(accountId)) {
    return NextResponse.json({ error: "Select an account" }, { status: 400 });
  }
  if (!(await getAccountById(accountId))) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const date = String(body.activity_date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const posts = Number(body.posts_count);
  const comments = Number(body.comments_count);
  if (!Number.isInteger(posts) || posts < 0 || !Number.isInteger(comments) || comments < 0) {
    return NextResponse.json(
      { error: "Posts and comments must be zero or more" },
      { status: 400 }
    );
  }
  if (posts === 0 && comments === 0 && body.total_karma == null) {
    return NextResponse.json(
      { error: "Enter at least one post, comment, or a karma total" },
      { status: 400 }
    );
  }

  const karmaRaw = body.total_karma;
  const totalKarma =
    karmaRaw === "" || karmaRaw == null ? null : Number(karmaRaw);
  if (totalKarma !== null && (!Number.isFinite(totalKarma) || totalKarma < 0)) {
    return NextResponse.json({ error: "Invalid karma total" }, { status: 400 });
  }

  try {
    const row = await upsertDailyActivity({
      account_id: accountId,
      activity_date: date,
      posts_count: posts,
      comments_count: comments,
      total_karma: totalKarma,
      notes: String(body.notes ?? "").trim() || null,
    });

    // A karma total also becomes a snapshot so growth charts have data.
    if (totalKarma !== null) {
      await insertSnapshot({
        account_id: accountId,
        link_karma: 0,
        comment_karma: 0,
        total_karma: totalKarma,
        taken_at: Math.floor(new Date(`${date}T12:00:00`).getTime() / 1000),
      });
    }

    for (const path of ["/", "/accounts", "/activity", "/analytics", "/insights"]) {
      revalidatePath(path);
    }
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
