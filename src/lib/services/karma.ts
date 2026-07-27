// Karma history series for the charts.
import { getAllSnapshots } from "@/lib/repos/karma";
import type { KarmaSnapshot } from "@/lib/types";

const DAY = 86400;

/**
 * Daily total-karma series, summed across accounts (or for one account).
 * Pass `preloaded` to reuse snapshots already fetched by the caller instead of
 * issuing another query.
 */
export function buildKarmaGrowthSeries(
  snapshots: KarmaSnapshot[],
  accountId: number | null,
  days = 30
): { date: string; time: number; total: number }[] {
  const since = Math.floor(Date.now() / 1000) - days * DAY;
  const rows = snapshots.filter(
    (s) => s.taken_at >= since && (!accountId || s.account_id === accountId)
  );
  if (!rows.length) return [];

  // Last snapshot per account per day, then sum per day carrying each
  // account's most recent value forward.
  const byAccountDay = new Map<
    string,
    { account: number; day: string; total: number }
  >();
  for (const s of rows) {
    const day = new Date(s.taken_at * 1000).toISOString().slice(0, 10);
    byAccountDay.set(`${s.account_id}:${day}`, {
      account: s.account_id,
      day,
      total: s.total_karma,
    });
  }

  const perDay = new Map<string, { account: number; total: number }[]>();
  for (const v of byAccountDay.values()) {
    const list = perDay.get(v.day);
    if (list) list.push({ account: v.account, total: v.total });
    else perDay.set(v.day, [{ account: v.account, total: v.total }]);
  }

  const lastByAccount = new Map<number, number>();
  const out: { date: string; time: number; total: number }[] = [];
  for (const day of [...perDay.keys()].sort()) {
    for (const entry of perDay.get(day)!) {
      lastByAccount.set(entry.account, entry.total);
    }
    let sum = 0;
    for (const v of lastByAccount.values()) sum += v;
    out.push({ date: day, time: new Date(day + "T12:00:00").getTime(), total: sum });
  }
  return out;
}

/** Convenience wrapper that fetches snapshots itself. */
export async function getKarmaGrowthSeries(
  accountId: number | null,
  days = 30
): Promise<{ date: string; time: number; total: number }[]> {
  return buildKarmaGrowthSeries(await getAllSnapshots(), accountId, days);
}
