// Karma history series for the charts. Nothing else - no trend detection,
// no scoring, no suggestions.
import { getSnapshotsSince } from "@/lib/repos/karma";

const DAY = 86400;

/** Daily total-karma series, summed across accounts or for one account. */
export async function getKarmaGrowthSeries(
  accountId: number | null,
  days = 30
): Promise<{ date: string; time: number; total: number }[]> {
  const since = Math.floor(Date.now() / 1000) - days * DAY;
  let snapshots = await getSnapshotsSince(since);
  if (accountId) snapshots = snapshots.filter((s) => s.account_id === accountId);
  if (!snapshots.length) return [];

  // Keep the last snapshot per account per day, then sum per day carrying
  // each account's most recent value forward.
  const byAccountDay = new Map<
    string,
    { account: number; day: string; total: number }
  >();
  for (const s of snapshots) {
    const day = new Date(s.taken_at * 1000).toISOString().slice(0, 10);
    byAccountDay.set(`${s.account_id}:${day}`, {
      account: s.account_id,
      day,
      total: s.total_karma,
    });
  }
  const rows = [...byAccountDay.values()].sort((a, b) => a.day.localeCompare(b.day));
  const days_ = [...new Set(rows.map((r) => r.day))];
  const lastByAccount = new Map<number, number>();
  const out: { date: string; time: number; total: number }[] = [];
  for (const day of days_) {
    for (const r of rows.filter((r) => r.day === day)) {
      lastByAccount.set(r.account, r.total);
    }
    let sum = 0;
    for (const v of lastByAccount.values()) sum += v;
    out.push({ date: day, time: new Date(day + "T12:00:00").getTime(), total: sum });
  }
  return out;
}
