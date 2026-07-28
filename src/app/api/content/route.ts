import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { addContent, listContent } from "@/lib/repos/content";
import { addDailyActivity } from "@/lib/repos/dailyActivity";
import { getAccountById } from "@/lib/repos/accounts";
import { zonedEpoch } from "@/lib/date";

export async function GET(req: Request) {
  const accountId = new URL(req.url).searchParams.get("accountId");
  return NextResponse.json(
    await listContent(accountId ? Number(accountId) : null)
  );
}

/**
 * Save a written post or comment. Also adds 1 to that day's count so the
 * dashboard totals stay in step - no need to log the count separately.
 */
export async function POST(req: Request) {
  const body = await req.json();

  const accountId = Number(body.account_id);
  if (!Number.isInteger(accountId)) {
    return NextResponse.json({ error: "Select an account" }, { status: 400 });
  }
  if (!(await getAccountById(accountId))) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const kind = body.kind === "comment" ? "comment" : "post";
  const subreddit = String(body.subreddit ?? "").trim().replace(/^r\//i, "");
  if (!subreddit) {
    return NextResponse.json({ error: "Subreddit is required" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const text = String(body.body ?? "").trim();
  if (kind === "post" && !title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (kind === "comment" && !text) {
    return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
  }

  const date = String(body.activity_date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  // Midday in the app timezone, so the stored instant always reads back as the
  // date the user chose - not the server's UTC date.
  const postedAt = zonedEpoch(date, 12);

  try {
    const item = await addContent({
      account_id: accountId,
      kind,
      subreddit,
      title,
      body: text,
      url: String(body.url ?? "").trim() || null,
      posted_at: postedAt,
    });

    await addDailyActivity({
      account_id: accountId,
      activity_date: date,
      posts_count: kind === "post" ? 1 : 0,
      comments_count: kind === "comment" ? 1 : 0,
      total_karma: null,
      notes: null,
    });

    for (const p of ["/", "/activity", "/accounts"]) revalidatePath(p);
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
