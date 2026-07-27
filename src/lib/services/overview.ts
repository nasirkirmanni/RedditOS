// Account overview: karma totals, growth, and manually logged activity counts.
import { type Account, type AccountOverview } from "@/lib/types";
import { listAccounts } from "@/lib/repos/accounts";
import { getLatestSnapshots, getBaselineSnapshot } from "@/lib/repos/karma";
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

function dateStringToEpoch(date: string): number {
  return Math.floor(new Date(`${date}T12:00:00`).getTime() / 1000);
}

async function build(
  account: Account,
  dailyRows: DailyActivity[],
  subs: string[]
): Promise<AccountOverview> {
  const now = Math.floor(Date.now() / 1000);
  const today = todayDateString();

  const [latestMap, weekBaseline, dayBaseline] = await Promise.all([
    getLatestSnapshots([account.id]),
    getBaselineSnapshot(account.id, now - 7 * DAY),
    getBaselineSnapshot(account.id, dateStringToEpoch(today) - 12 * 3600),
  ]);

  const mine = dailyRows.filter((r) => r.account_id === account.id);
  const todayRow = mine.find((r) => r.activity_date === today);
  const lastLogged = mine[0]?.activity_date ?? null;
  const latest = latestMap.get(account.id);

  return {
    ...account,
    subreddits: subs,
    total_karma: latest?.total_karma ?? 0,
    link_karma: latest?.link_karma ?? 0,
    comment_karma: latest?.comment_karma ?? 0,
    karma_delta_7d:
      latest && weekBaseline ? latest.total_karma - weekBaseline.total_karma : 0,
    karma_today:
      latest && dayBaseline ? latest.total_karma - dayBaseline.total_karma : 0,
    post_count: mine.reduce((s, r) => s + r.posts_count, 0),
    comment_count: mine.reduce((s, r) => s + r.comments_count, 0),
    posts_today: todayRow?.posts_count ?? 0,
    comments_today: todayRow?.comments_count ?? 0,
    last_logged_date: lastLogged,
  };
}

export async function getAccountOverviews(): Promise<AccountOverview[]> {
  const [accounts, dailyRows, subsByAccount] = await Promise.all([
    listAccounts(),
    listAllDailyActivity(),
    getSubredditsByAccount(),
  ]);
  return Promise.all(
    accounts.map((a) => build(a, dailyRows, subsByAccount.get(a.id) ?? []))
  );
}

export async function getAccountOverview(
  account: Account
): Promise<AccountOverview> {
  const [dailyRows, subsByAccount] = await Promise.all([
    listAllDailyActivity(),
    getSubredditsByAccount(),
  ]);
  return build(account, dailyRows, subsByAccount.get(account.id) ?? []);
}
