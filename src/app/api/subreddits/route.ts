import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  listSubreddits,
  createSubreddit,
  deleteSubreddit,
} from "@/lib/repos/subreddits";

export async function GET() {
  return NextResponse.json(await listSubreddits());
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body.name ?? "").trim().replace(/^r\//i, "");
  if (!name) {
    return NextResponse.json({ error: "Subreddit name is required" }, { status: 400 });
  }
  if (!/^[A-Za-z0-9_]{1,30}$/.test(name)) {
    return NextResponse.json(
      { error: "Subreddit names can only contain letters, numbers and _" },
      { status: 400 }
    );
  }
  try {
    await createSubreddit(
      name,
      String(body.topic ?? "").trim() || null,
      String(body.notes ?? "").trim() || null
    );
    revalidatePath("/subreddits");
    return NextResponse.json({ ok: true, name }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const name = new URL(req.url).searchParams.get("name");
  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }
  const deleted = await deleteSubreddit(name);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidatePath("/subreddits");
  revalidatePath("/accounts");
  return NextResponse.json({ ok: true });
}
