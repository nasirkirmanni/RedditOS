import { getSupabase } from "@/lib/supabase";
import {
  type Account,
  type ManagementStatus,
  toEpoch,
  toEpochRequired,
  toIso,
} from "@/lib/types";

const SELECT = "*, account_projects(project_id, projects(id, name))";

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapAccount(row: any): Account {
  return {
    id: row.id,
    username: row.username,
    label: row.label ?? null,
    notes: row.notes ?? null,
    status: row.status,
    avatar_url: row.avatar_url ?? null,
    reddit_created_utc: toEpoch(row.reddit_created_at),
    created_at: toEpochRequired(row.created_at),
    projects: (row.account_projects ?? [])
      .map((ap: any) => ap.projects)
      .filter(Boolean)
      .map((p: any) => ({ id: p.id, name: p.name })),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function listAccounts(): Promise<Account[]> {
  const { data, error } = await getSupabase()
    .from("accounts")
    .select(SELECT)
    .order("username");
  if (error) throw new Error(`accounts list failed: ${error.message}`);
  return (data ?? []).map(mapAccount);
}

export async function getAccountById(id: number): Promise<Account | null> {
  const { data, error } = await getSupabase()
    .from("accounts")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`account read failed: ${error.message}`);
  return data ? mapAccount(data) : null;
}

export async function getAccountByUsername(
  username: string
): Promise<Account | null> {
  const { data, error } = await getSupabase()
    .from("accounts")
    .select(SELECT)
    .ilike("username", username)
    .maybeSingle();
  if (error) throw new Error(`account read failed: ${error.message}`);
  return data ? mapAccount(data) : null;
}

/** Create an account. No verification - the username is taken as given. */
export async function createAccount(input: {
  username: string;
  label?: string | null;
  notes?: string | null;
  status?: ManagementStatus;
}): Promise<Account> {
  const { data, error } = await getSupabase()
    .from("accounts")
    .insert({
      username: input.username,
      label: input.label ?? null,
      notes: input.notes ?? null,
      status: input.status ?? "active",
    })
    .select(SELECT)
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("Account already tracked");
    throw new Error(`account create failed: ${error.message}`);
  }
  return mapAccount(data);
}

export async function updateAccount(
  id: number,
  patch: Partial<{
    label: string | null;
    notes: string | null;
    status: ManagementStatus;
    avatar_url: string | null;
    reddit_created_utc: number | null;
  }>
): Promise<void> {
  const row: Record<string, unknown> = {};
  if ("label" in patch) row.label = patch.label;
  if ("notes" in patch) row.notes = patch.notes;
  if ("status" in patch) row.status = patch.status;
  if ("avatar_url" in patch) row.avatar_url = patch.avatar_url;
  if ("reddit_created_utc" in patch)
    row.reddit_created_at =
      patch.reddit_created_utc == null ? null : toIso(patch.reddit_created_utc);
  if (!Object.keys(row).length) return;
  const { error } = await getSupabase().from("accounts").update(row).eq("id", id);
  if (error) throw new Error(`account update failed: ${error.message}`);
}

export async function deleteAccount(id: number): Promise<boolean> {
  const { error, count } = await getSupabase()
    .from("accounts")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(`account delete failed: ${error.message}`);
  return (count ?? 0) > 0;
}
