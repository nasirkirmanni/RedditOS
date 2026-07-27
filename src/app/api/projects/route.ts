import { NextResponse } from "next/server";
import { listProjects, createProject } from "@/lib/repos/projects";

export async function GET() {
  return NextResponse.json(await listProjects());
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }
  try {
    const project = await createProject(
      name,
      String(body.description ?? "").trim() || null
    );
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("duplicate") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
