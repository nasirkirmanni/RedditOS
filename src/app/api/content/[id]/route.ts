import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteContent, getContent } from "@/lib/repos/content";
import { decrementDailyActivity } from "@/lib/repos/dailyActivity";
import { toZonedDateString } from "@/lib/date";

/**
 * Remove a saved post or comment, and take it back out of that day's counts so
 * the dashboard, account page and activity log all agree.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const contentId = decodeURIComponent(id);

  // Read it first - once deleted we no longer know which day to adjust.
  const item = await getContent(contentId);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const deleted = await deleteContent(contentId);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await decrementDailyActivity(
    item.account_id,
    toZonedDateString(new Date(item.posted_at * 1000)),
    item.kind === "post" ? 1 : 0,
    item.kind === "comment" ? 1 : 0
  );

  for (const p of ["/", "/activity", "/accounts", `/accounts/${item.username}`]) {
    revalidatePath(p);
  }
  return NextResponse.json({ ok: true, kind: item.kind });
}
