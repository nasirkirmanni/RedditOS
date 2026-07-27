import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { updateAccount, deleteAccount, getAccountById } from "@/lib/repos/accounts";
import { setAccountProjects } from "@/lib/repos/projects";
import { setAccountSubreddits } from "@/lib/repos/subreddits";
import type { ManagementStatus } from "@/lib/types";

const STATUSES: ManagementStatus[] = ["active", "resting", "suspended", "disabled"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accountId = Number(id);
  if (!Number.isInteger(accountId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  if (!(await getAccountById(accountId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const patch: Parameters<typeof updateAccount>[1] = {};
  if ("label" in body) patch.label = String(body.label ?? "").trim() || null;
  if ("notes" in body) patch.notes = String(body.notes ?? "").trim() || null;
  if ("status" in body) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch.status = body.status;
  }
  await updateAccount(accountId, patch);

  if (Array.isArray(body.project_ids)) {
    await setAccountProjects(
      accountId,
      body.project_ids.map(Number).filter(Number.isInteger)
    );
  }
  if (body.subreddits !== undefined) {
    const list: string[] = Array.isArray(body.subreddits)
      ? body.subreddits.map(String)
      : String(body.subreddits ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    await setAccountSubreddits(accountId, list);
  }

  revalidatePath("/");
  revalidatePath("/accounts");
  revalidatePath("/subreddits");
  return NextResponse.json(await getAccountById(accountId));
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accountId = Number(id);
  if (!Number.isInteger(accountId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const deleted = await deleteAccount(accountId);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidatePath("/");
  revalidatePath("/accounts");
  revalidatePath("/subreddits");
  return NextResponse.json({ ok: true });
}
