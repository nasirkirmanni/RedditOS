import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteContent } from "@/lib/repos/content";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const deleted = await deleteContent(decodeURIComponent(id));
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  for (const p of ["/", "/activity", "/accounts"]) revalidatePath(p);
  return NextResponse.json({ ok: true });
}
