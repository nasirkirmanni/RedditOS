// Account overview: karma totals, growth, and logged activity counts.
//
// Everything is derived from four parallel queries regardless of how many
// accounts exist - no per-account round-trips.
import {
  type Account,
  type AccountOverview,
  type KarmaSnapshot,
} from "@/lib/types";
import { listAccounts, getAccountByUsername } from "@/lib/repos/accounts";
import { getAllSnapshots } from "@/lib/repos/karma";
import {
  listAllDailyActivity,
  type DailyActivity,
} from "@/lib/repos/dailyActivity";
import { getSubredditsByAccount } from "@/lib/repos/subreddits";

const DAY = 86400;

export function todayDateString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Snapshots grouped by account, each already ordered oldest-first. */
function groupSnapshots(all: KarmaSnapshot[]): Map<number, KarmaSnapshot[]> {
  const byAccount = new Map<number, KarmaSnapshot[]>();
  for (const s of all) {
    const list = byAccount.get(s.account_id);
    if (list) list.push(s);
    else byAccount.set(s.account_id, [s]);
  }
  return byAccount;
}

/** Most recent snapshot at or before a cutoff, else the oldest available. */
function baselineAt(
  snapshots: KarmaSnapshot[],
  cutoffEpoch: number
): KarmaSnapshot | undefined {
  let baseline: KarmaSnapshot | undefined;
  for (const s of snapshots) {
    if (s.taken_at <= cutoffEpoch) baseline = s;
    else break; // ordered oldest-first
  }
  return baseline ?? snapshots[0];
}

function build(
  account: Account,
  snapshots: KarmaSnapshot[],
  daily: DailyActivity[],
  subreddits: string[]
): AccountOverview {
  const now = Math.floor(Date.now() / 1000);
  const today = todayDateString();
  const todayStart = Math.floor(new Date(`${today}T00:00:00`).getTime() / 1000);

  const latest = snapshots[snapshots.length - 1];
  const weekBaseline = baselineAt(snapshots, now - 7 * DAY);
  const dayBaseline = baselineAt(snapshots, todayStart);

  // A day can hold several entries - sum them.
  const todayRows = daily.filter((r) => r.activity_date === today);
  const postsToday = todayRows.reduce((s, r) => s + r.posts_count, 0);
  const commentsToday = todayRows.reduce((s, r) => s + r.comments_count, 0);

  return {
    ...account,
    subreddits,
    total_karma: latest?.total_karma ?? 0,
    link_karma: latest?.link_karma ?? 0,
    comment_karma: latest?.comment_karma ?? 0,
    karma_delta_7d:
      latest && weekBaseline ? latest.total_karma - weekBaseline.total_karma : 0,
    karma_today:
      latest && dayBaseline ? latest.total_karma - dayBaseline.total_karma : 0,
    post_count: daily.reduce((s, r) => s + r.posts_count, 0),
    comment_count: daily.reduce((s, r) => s + r.comments_count, 0),
    posts_today: postsToday,
    comments_today: commentsToday,
    last_logged_date: daily[0]?.activity_date ?? null,
  };
}

export type OverviewBundle = {
  overviews: AccountOverview[];
  snapshots: KarmaSnapshot[];
  daily: DailyActivity[];
};

/** Single fetch of everything the dashboard needs. */
export async function getOverviewBundle(): Promise<OverviewBundle> {
  const [accounts, snapshots, daily, subsByAccount] = await Promise.all([
    listAccounts(),
    getAllSnapshots(),
    listAllDailyActivity(),
    getSubredditsByAccount(),
  ]);

  const snapshotsByAccount = groupSnapshots(snapshots);
  const dailyByAccount = new Map<number, DailyActivity[]>();
  for (const row of daily) {
    const list = dailyByAccount.get(row.account_id);
    if (list) list.push(row);
    else dailyByAccount.set(row.account_id, [row]);
  }

  const overviews = accounts.map((a) =>
    build(
      a,
      snapshotsByAccount.get(a.id) ?? [],
      dailyByAccount.get(a.id) ?? [],
      subsByAccount.get(a.id) ?? []
    )
  );
  return { overviews, snapshots, daily };
}

export async function getAccountOverviews(): Promise<AccountOverview[]> {
  return (await getOverviewBundle()).overviews;
}

/** Overview for one account, by username - three parallel queries. */
export async function getAccountOverviewByUsername(
  username: string
): Promise<{ account: Account; overview: AccountOverview } | null> {
  const account = await getAccountByUsername(username);
  if (!account) return null;
  const [snapshots, daily, subsByAccount] = await Promise.all([
    getAllSnapshots(),
    listAllDailyActivity(),
    getSubredditsByAccount(),
  ]);
  return {
    account,
    overview: build(
      account,
      snapshots.filter((s) => s.account_id === account.id),
      daily.filter((d) => d.account_id === account.id),
      subsByAccount.get(account.id) ?? []
    ),
  };
}
