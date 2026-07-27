// Subreddits and their account associations.
import { getSupabase } from "@/lib/supabase";
import { isMissingTable, noteMissing } from "./missing-table";

export type Subreddit = {
  name: string;
  topic: string | null;
  notes: string | null;
  accounts: { id: number; username: string }[];
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function map(row: any): Subreddit {
  return {
    name: row.name,
    topic: row.topic ?? null,
    notes: row.notes ?? null,
    accounts: (row.account_subreddits ?? [])
      .map((a: any) => a.accounts)
      .filter(Boolean)
      .map((a: any) => ({ id: a.id, username: a.username })),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function listSubreddits(): Promise<Subreddit[]> {
  const db = getSupabase();
  const { data, error } = await db
    .from("subreddits")
    .select("name, topic, notes, account_subreddits(accounts(id, username))")
    .order("name");
  if (isMissingTable(error)) {
    noteMissing("account_subreddits");
    // Fall back to the subreddit list without associations.
    const plain = await db.from("subreddits").select("name, topic, notes").order("name");
    if (plain.error) return [];
    return (plain.data ?? []).map(map);
  }
  if (error) throw new Error(`subreddits read failed: ${error.message}`);
  return (data ?? []).map(map);
}

export async function createSubreddit(
  name: string,
  topic?: string | null,
  notes?: string | null
): Promise<void> {
  const { error } = await getSupabase()
    .from("subreddits")
    .upsert(
      { name, topic: topic ?? null, notes: notes ?? null },
      { onConflict: "name" }
    );
  if (error) throw new Error(`subreddit save failed: ${error.message}`);
}

export async function deleteSubreddit(name: string): Promise<boolean> {
  const { error, count } = await getSupabase()
    .from("subreddits")
    .delete({ count: "exact" })
    .eq("name", name);
  if (error) throw new Error(`subreddit delete failed: ${error.message}`);
  return (count ?? 0) > 0;
}

/** Subreddits assigned to one account. */
export async function getAccountSubreddits(accountId: number): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from("account_subreddits")
    .select("subreddit")
    .eq("account_id", accountId)
    .order("subreddit");
  if (isMissingTable(error)) {
    noteMissing("account_subreddits");
    return [];
  }
  if (error) throw new Error(`account subreddits read failed: ${error.message}`);
  return (data ?? []).map((r) => r.subreddit as string);
}

/** All assignments at once, keyed by account id. */
export async function getSubredditsByAccount(): Promise<Map<number, string[]>> {
  const { data, error } = await getSupabase()
    .from("account_subreddits")
    .select("account_id, subreddit")
    .order("subreddit");
  if (isMissingTable(error)) {
    noteMissing("account_subreddits");
    return new Map();
  }
  if (error) throw new Error(`assignments read failed: ${error.message}`);
  const map_ = new Map<number, string[]>();
  for (const row of data ?? []) {
    const list = map_.get(row.account_id) ?? [];
    list.push(row.subreddit);
    map_.set(row.account_id, list);
  }
  return map_;
}

/** Replace an account's subreddit list, creating any new subreddits. */
export async function setAccountSubreddits(
  accountId: number,
  subreddits: string[]
): Promise<void> {
  const db = getSupabase();
  const clean = [...new Set(subreddits.map((s) => s.trim().replace(/^r\//i, "")))].filter(
    Boolean
  );

  if (clean.length) {
    const { error: subError } = await db
      .from("subreddits")
      .upsert(clean.map((name) => ({ name })), {
        onConflict: "name",
        ignoreDuplicates: true,
      });
    if (subError) throw new Error(`subreddit create failed: ${subError.message}`);
  }

  const { error: delError } = await db
    .from("account_subreddits")
    .delete()
    .eq("account_id", accountId);
  if (delError) throw new Error(`unassign failed: ${delError.message}`);

  if (clean.length) {
    const { error } = await db
      .from("account_subreddits")
      .insert(clean.map((subreddit) => ({ account_id: accountId, subreddit })));
    if (error) throw new Error(`assign failed: ${error.message}`);
  }
}
