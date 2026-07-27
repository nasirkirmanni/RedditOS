import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { listAccounts, createAccount } from "@/lib/repos/accounts";
import { setAccountProjects } from "@/lib/repos/projects";
import { setAccountSubreddits } from "@/lib/repos/subreddits";

export async function GET() {
  return NextResponse.json(await listAccounts());
}

/** Add an account. No verification, no credentials - just a username. */
export async function POST(req: Request) {
  const body = await req.json();
  const username = String(body.username ?? "").trim().replace(/^u\//i, "");
  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }
  if (!/^[A-Za-z0-9_-]{1,20}$/.test(username)) {
    return NextResponse.json(
      { error: "Usernames can only contain letters, numbers, _ and -" },
      { status: 400 }
    );
  }

  try {
    const account = await createAccount({
      username,
      label: String(body.label ?? "").trim() || null,
      notes: String(body.notes ?? "").trim() || null,
    });

    const projectIds: number[] = Array.isArray(body.project_ids)
      ? body.project_ids.map(Number).filter(Number.isInteger)
      : [];
    if (projectIds.length) await setAccountProjects(account.id, projectIds);

    const subreddits: string[] = Array.isArray(body.subreddits)
      ? body.subreddits.map(String)
      : String(body.subreddits ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    if (subreddits.length) await setAccountSubreddits(account.id, subreddits);

    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/subreddits");
    return NextResponse.json(account, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message === "Account already tracked" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
