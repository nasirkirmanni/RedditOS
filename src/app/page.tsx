import Link from "next/link";
import { getOverviewBundle, yesterdayDateString } from "@/lib/services/overview";
import { buildKarmaGrowthSeries } from "@/lib/services/karma";
import { listContent } from "@/lib/repos/content";
import { listSubreddits } from "@/lib/repos/subreddits";
import { formatKarma } from "@/lib/format";
import { StatTile, Delta } from "@/components/StatTile";
import { StatusBadge } from "@/components/Badges";
import Avatar from "@/components/Avatar";
import GrowthChart from "@/components/GrowthChart";
import QuickLog from "@/components/QuickLog";
import YesterdayWidget from "@/components/YesterdayWidget";
import EmptyState from "@/components/EmptyState";
import SetupNotice from "@/components/SetupNotice";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  // One bundled fetch: accounts, snapshots, activity log and subreddit links.
  const { overviews: accounts, snapshots, daily } = await getOverviewBundle();

  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <SetupNotice />
        <EmptyState
          title="No accounts yet"
          message="Add your Reddit accounts to start tracking. Just a username - no passwords, no verification."
          actionHref="/accounts"
          actionLabel="Add an account"
        />
      </div>
    );
  }

  const [content, subreddits] = await Promise.all([
    listContent(null, 20),
    listSubreddits(),
  ]);
  const growth = buildKarmaGrowthSeries(snapshots, null, 30);
  const dailyLog = daily.slice(0, 20);

  const totalKarma = accounts.reduce((s, a) => s + a.total_karma, 0);
  const karma7d = accounts.reduce((s, a) => s + a.karma_delta_7d, 0);
  const postsToday = accounts.reduce((s, a) => s + a.posts_today, 0);
  const commentsToday = accounts.reduce((s, a) => s + a.comments_today, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <SetupNotice />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Accounts" value={String(accounts.length)} />
        <StatTile
          label="Total karma"
          value={formatKarma(totalKarma)}
          sub={<Delta value={karma7d} suffix=" this week" />}
        />
        <StatTile label="Posts today" value={String(postsToday)} />
        <StatTile label="Comments today" value={String(commentsToday)} />
      </div>

      <YesterdayWidget accounts={accounts} date={yesterdayDateString()} />

      <QuickLog
        accounts={accounts}
        recent={dailyLog}
        subreddits={subreddits.map((s) => s.name)}
        content={content}
      />

      <section className="card overflow-hidden">
        <h2 className="border-b border-[var(--gridline)] px-4 py-3 text-sm font-semibold">
          Accounts
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-[var(--gridline)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-2.5 font-medium">Account</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="tabular px-3 py-2.5 text-right font-medium">Karma</th>
                <th className="tabular px-3 py-2.5 text-right font-medium">
                  This week
                </th>
                <th className="tabular px-3 py-2.5 text-right font-medium">
                  Posts today
                </th>
                <th className="tabular px-3 py-2.5 text-right font-medium">
                  Comments today
                </th>
                <th className="px-4 py-2.5 font-medium">Last entry</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-[var(--gridline)] last:border-0 hover:bg-[var(--surface-2)]"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/accounts/${a.username}`}
                      className="flex items-center gap-2.5 font-medium hover:underline"
                    >
                      <Avatar username={a.username} url={a.avatar_url} size={30} />
                      <span className="truncate">u/{a.username}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="tabular px-3 py-2.5 text-right font-semibold">
                    {a.total_karma ? formatKarma(a.total_karma) : "-"}
                  </td>
                  <td className="tabular px-3 py-2.5 text-right">
                    <Delta value={a.karma_delta_7d} />
                  </td>
                  <td className="tabular px-3 py-2.5 text-right">{a.posts_today}</td>
                  <td className="tabular px-3 py-2.5 text-right">
                    {a.comments_today}
                  </td>
                  <td className="tabular px-4 py-2.5 text-[var(--text-secondary)]">
                    {a.last_logged_date ?? "never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card px-4 py-4">
        <h2 className="mb-2 text-sm font-semibold">Karma growth - 30 days</h2>
        <GrowthChart data={growth} />
      </section>
    </div>
  );
}
