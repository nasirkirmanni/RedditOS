import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteDailyActivity } from "@/lib/repos/dailyActivity";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rowId = Number(id);
  if (!Number.isInteger(rowId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const deleted = await deleteDailyActivity(rowId);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
