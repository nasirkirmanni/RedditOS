import { getSupabase } from "@/lib/supabase";
import { type Project, toEpochRequired } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    created_at: toEpochRequired(row.created_at),
    account_count: Array.isArray(row.account_projects)
      ? (row.account_projects[0]?.count ?? 0)
      : undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await getSupabase()
    .from("projects")
    .select("*, account_projects(count)")
    .order("name");
  if (error) throw new Error(`projects list failed: ${error.message}`);
  return (data ?? []).map(mapProject);
}

export async function createProject(
  name: string,
  description?: string | null
): Promise<Project> {
  const { data, error } = await getSupabase()
    .from("projects")
    .insert({ name, description: description ?? null })
    .select()
    .single();
  if (error) throw new Error(`project create failed: ${error.message}`);
  return mapProject(data);
}

export async function updateProject(
  id: number,
  patch: { name?: string; description?: string | null }
): Promise<void> {
  const { error } = await getSupabase().from("projects").update(patch).eq("id", id);
  if (error) throw new Error(`project update failed: ${error.message}`);
}

export async function deleteProject(id: number): Promise<boolean> {
  const { error, count } = await getSupabase()
    .from("projects")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(`project delete failed: ${error.message}`);
  return (count ?? 0) > 0;
}

/** Replace an account's project assignments with the given set. */
export async function setAccountProjects(
  accountId: number,
  projectIds: number[]
): Promise<void> {
  const db = getSupabase();
  const { error: delError } = await db
    .from("account_projects")
    .delete()
    .eq("account_id", accountId);
  if (delError) throw new Error(`project unassign failed: ${delError.message}`);
  if (projectIds.length) {
    const { error } = await db
      .from("account_projects")
      .insert(projectIds.map((project_id) => ({ account_id: accountId, project_id })));
    if (error) throw new Error(`project assign failed: ${error.message}`);
  }
}
