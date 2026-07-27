// Manually logged daily activity counts (one row per account per day).
import { getSupabase } from "@/lib/supabase";
import { isMissingTable, noteMissing } from "./missing-table";

export type DailyActivity = {
  id: number;
  account_id: number;
  username?: string;
  activity_date: string; // YYYY-MM-DD
  posts_count: number;
  comments_count: number;
  total_karma: number | null;
  notes: string | null;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function map(row: any): DailyActivity {
  return {
    id: row.id,
    account_id: row.account_id,
    username: row.accounts?.username,
    activity_date: row.activity_date,
    posts_count: row.posts_count,
    comments_count: row.comments_count,
    total_karma: row.total_karma ?? null,
    notes: row.notes ?? null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function listDailyActivity(limit = 60): Promise<DailyActivity[]> {
  const { data, error } = await getSupabase()
    .from("daily_activity")
    .select("*, accounts(username)")
    .order("activity_date", { ascending: false })
    .limit(limit);
  if (isMissingTable(error)) {
    noteMissing("daily_activity");
    return [];
  }
  if (error) throw new Error(`daily activity read failed: ${error.message}`);
  return (data ?? []).map(map);
}

export async function listDailyActivityForAccount(
  accountId: number
): Promise<DailyActivity[]> {
  const { data, error } = await getSupabase()
    .from("daily_activity")
    .select("*")
    .eq("account_id", accountId)
    .order("activity_date", { ascending: false });
  if (isMissingTable(error)) {
    noteMissing("daily_activity");
    return [];
  }
  if (error) throw new Error(`daily activity read failed: ${error.message}`);
  return (data ?? []).map(map);
}

/** All rows, used by the overview service to fold manual counts into totals. */
export async function listAllDailyActivity(): Promise<DailyActivity[]> {
  const { data, error } = await getSupabase()
    .from("daily_activity")
    .select("*")
    .order("activity_date", { ascending: false });
  if (isMissingTable(error)) {
    noteMissing("daily_activity");
    return [];
  }
  if (error) throw new Error(`daily activity read failed: ${error.message}`);
  return (data ?? []).map(map);
}

export async function upsertDailyActivity(input: {
  account_id: number;
  activity_date: string;
  posts_count: number;
  comments_count: number;
  total_karma?: number | null;
  notes?: string | null;
}): Promise<DailyActivity> {
  const { data, error } = await getSupabase()
    .from("daily_activity")
    .upsert(
      {
        account_id: input.account_id,
        activity_date: input.activity_date,
        posts_count: input.posts_count,
        comments_count: input.comments_count,
        total_karma: input.total_karma ?? null,
        notes: input.notes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id,activity_date" }
    )
    .select("*, accounts(username)")
    .single();
  if (error) throw new Error(`daily activity save failed: ${error.message}`);
  return map(data);
}

export async function deleteDailyActivity(id: number): Promise<boolean> {
  const { error, count } = await getSupabase()
    .from("daily_activity")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(`daily activity delete failed: ${error.message}`);
  return (count ?? 0) > 0;
}
