// Karma snapshots, per-item score history, and sync log entries.
import { getSupabase } from "@/lib/supabase";
import { type KarmaSnapshot, toEpochRequired, toIso } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapSnapshot(row: any): KarmaSnapshot {
  return {
    id: row.id,
    account_id: row.account_id,
    link_karma: row.link_karma,
    comment_karma: row.comment_karma,
    total_karma: row.total_karma,
    taken_at: toEpochRequired(row.taken_at),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getKarmaHistory(accountId: number): Promise<KarmaSnapshot[]> {
  const { data, error } = await getSupabase()
    .from("karma_snapshots")
    .select("*")
    .eq("account_id", accountId)
    .order("taken_at");
  if (error) throw new Error(`karma history failed: ${error.message}`);
  return (data ?? []).map(mapSnapshot);
}

/** All snapshots since a timestamp, all accounts (for fleet growth charts). */
export async function getSnapshotsSince(
  sinceEpoch: number
): Promise<KarmaSnapshot[]> {
  const { data, error } = await getSupabase()
    .from("karma_snapshots")
    .select("*")
    .gte("taken_at", toIso(sinceEpoch))
    .order("taken_at");
  if (error) throw new Error(`snapshots read failed: ${error.message}`);
  return (data ?? []).map(mapSnapshot);
}

/** Latest snapshot per account plus baselines, computed client-side from one fetch. */
export async function getLatestSnapshots(
  accountIds: number[]
): Promise<Map<number, KarmaSnapshot>> {
  const out = new Map<number, KarmaSnapshot>();
  if (!accountIds.length) return out;
  const { data, error } = await getSupabase()
    .from("karma_snapshots")
    .select("*")
    .in("account_id", accountIds)
    .order("taken_at", { ascending: false })
    .limit(accountIds.length * 3);
  if (error) throw new Error(`latest snapshots failed: ${error.message}`);
  for (const row of data ?? []) {
    if (!out.has(row.account_id)) out.set(row.account_id, mapSnapshot(row));
  }
  // any account missing from the recent window: fetch its single latest
  const missing = accountIds.filter((id) => !out.has(id));
  await Promise.all(
    missing.map(async (id) => {
      const { data: rows } = await getSupabase()
        .from("karma_snapshots")
        .select("*")
        .eq("account_id", id)
        .order("taken_at", { ascending: false })
        .limit(1);
      if (rows?.length) out.set(id, mapSnapshot(rows[0]));
    })
  );
  return out;
}

/** Most recent snapshot at-or-before a timestamp, per account. */
export async function getBaselineSnapshot(
  accountId: number,
  atOrBeforeEpoch: number
): Promise<KarmaSnapshot | null> {
  const { data, error } = await getSupabase()
    .from("karma_snapshots")
    .select("*")
    .eq("account_id", accountId)
    .lte("taken_at", toIso(atOrBeforeEpoch))
    .order("taken_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(`baseline snapshot failed: ${error.message}`);
  if (data?.length) return mapSnapshot(data[0]);
  // fall back to the oldest snapshot available
  const { data: oldest } = await getSupabase()
    .from("karma_snapshots")
    .select("*")
    .eq("account_id", accountId)
    .order("taken_at")
    .limit(1);
  return oldest?.length ? mapSnapshot(oldest[0]) : null;
}

export async function insertSnapshot(row: {
  account_id: number;
  link_karma: number;
  comment_karma: number;
  total_karma: number;
  taken_at?: number;
}): Promise<void> {
  const { error } = await getSupabase().from("karma_snapshots").insert({
    account_id: row.account_id,
    link_karma: row.link_karma,
    comment_karma: row.comment_karma,
    total_karma: row.total_karma,
    ...(row.taken_at ? { taken_at: toIso(row.taken_at) } : {}),
  });
  if (error) throw new Error(`snapshot insert failed: ${error.message}`);
}

export async function insertScoreHistory(
  rows: {
    account_id: number;
    item_id: string;
    item_kind: "post" | "comment";
    score: number;
  }[]
): Promise<void> {
  if (!rows.length) return;
  const { error } = await getSupabase().from("item_score_history").insert(rows);
  if (error) throw new Error(`score history insert failed: ${error.message}`);
}

// ---- sync log ----

export async function startSyncLog(accountId: number): Promise<number> {
  const { data, error } = await getSupabase()
    .from("sync_log")
    .insert({ account_id: accountId })
    .select("id")
    .single();
  if (error) throw new Error(`sync_log insert failed: ${error.message}`);
  return data.id;
}

export async function finishSyncLog(
  id: number,
  result:
    | { status: "ok"; newPosts: number; newComments: number }
    | { status: "error"; error: string }
): Promise<void> {
  const { error } = await getSupabase()
    .from("sync_log")
    .update(
      result.status === "ok"
        ? {
            finished_at: new Date().toISOString(),
            status: "ok",
            new_posts: result.newPosts,
            new_comments: result.newComments,
          }
        : {
            finished_at: new Date().toISOString(),
            status: "error",
            error: result.error,
          }
    )
    .eq("id", id);
  if (error) throw new Error(`sync_log update failed: ${error.message}`);
}
