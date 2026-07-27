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
  created_at: number | null;
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
    created_at: row.created_at
      ? Math.floor(new Date(row.created_at).getTime() / 1000)
      : null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function listDailyActivity(limit = 60): Promise<DailyActivity[]> {
  const { data, error } = await getSupabase()
    .from("daily_activity")
    .select("*, accounts(username)")
    .order("activity_date", { ascending: false })
    .order("id", { ascending: false })
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
    .order("activity_date", { ascending: false })
    .order("id", { ascending: false });
  if (isMissingTable(error)) {
    noteMissing("daily_activity");
    return [];
  }
  if (error) throw new Error(`daily activity read failed: ${error.message}`);
  return (data ?? []).map(map);
}

/**
 * All rows, used by the overview service and the dashboard's entry list.
 * Includes the account username so callers can render entries directly.
 */
export async function listAllDailyActivity(): Promise<DailyActivity[]> {
  const { data, error } = await getSupabase()
    .from("daily_activity")
    .select("*, accounts(username)")
    .order("activity_date", { ascending: false })
    .order("id", { ascending: false });
  if (isMissingTable(error)) {
    noteMissing("daily_activity");
    return [];
  }
  if (error) throw new Error(`daily activity read failed: ${error.message}`);
  return (data ?? []).map(map);
}

/**
 * Record an entry. Each save is added, never replaced - logging 3 comments and
 * then 2 more leaves 5 on that day.
 *
 * Prefers a separate row per entry. If the database still has the original
 * one-row-per-day unique constraint, the counts are merged into the existing
 * row instead so nothing is ever lost.
 */
export async function addDailyActivity(input: {
  account_id: number;
  activity_date: string;
  posts_count: number;
  comments_count: number;
  total_karma?: number | null;
  notes?: string | null;
}): Promise<DailyActivity> {
  const db = getSupabase();
  const row = {
    account_id: input.account_id,
    activity_date: input.activity_date,
    posts_count: input.posts_count,
    comments_count: input.comments_count,
    total_karma: input.total_karma ?? null,
    notes: input.notes ?? null,
  };

  const inserted = await db
    .from("daily_activity")
    .insert(row)
    .select("*, accounts(username)")
    .single();
  if (!inserted.error) return map(inserted.data);

  // 23505 = unique violation: the one-entry-per-day constraint is still in
  // place, so fold this entry into that day's existing row.
  if (inserted.error.code !== "23505") {
    throw new Error(`daily activity save failed: ${inserted.error.message}`);
  }

  const existing = await db
    .from("daily_activity")
    .select("*")
    .eq("account_id", input.account_id)
    .eq("activity_date", input.activity_date)
    .single();
  if (existing.error) {
    throw new Error(`daily activity save failed: ${existing.error.message}`);
  }

  const mergedNotes = [existing.data.notes, input.notes]
    .filter((n) => n && String(n).trim())
    .join(" | ");

  const { data, error } = await db
    .from("daily_activity")
    .update({
      posts_count: existing.data.posts_count + input.posts_count,
      comments_count: existing.data.comments_count + input.comments_count,
      // karma is a running total, not a delta - keep the newest reading
      total_karma: input.total_karma ?? existing.data.total_karma,
      notes: mergedNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.data.id)
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
