import Link from "next/link";
import { getAccountOverviews } from "@/lib/services/overview";
import { getKarmaGrowthSeries } from "@/lib/services/karma";
import { listAccounts } from "@/lib/repos/accounts";
import { listDailyActivity } from "@/lib/repos/dailyActivity";
import { formatKarma, timeAgo } from "@/lib/format";
import { StatTile, Delta } from "@/components/StatTile";
import { StatusBadge } from "@/components/Badges";
import Avatar from "@/components/Avatar";
import GrowthChart from "@/components/GrowthChart";
import TrackButton from "@/components/TrackButton";
import QuickLog from "@/components/QuickLog";
import EmptyState from "@/components/EmptyState";
import SetupNotice from "@/components/SetupNotice";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const accounts = await getAccountOverviews();

  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <EmptyState
          title="No accounts yet"
          message="Add your Reddit accounts to start tracking karma. Just a username - no passwords, no verification."
          actionHref="/accounts"
          actionLabel="Add an account"
        />
      </div>
    );
  }

  const [growth, accountList, dailyLog] = await Promise.all([
    getKarmaGrowthSeries(null, 30),
    listAccounts(),
    listDailyActivity(20),
  ]);

  const totalKarma = accounts.reduce((s, a) => s + a.total_karma, 0);
  const karmaToday = accounts.reduce((s, a) => s + a.karma_today, 0);
  const karma7d = accounts.reduce((s, a) => s + a.karma_delta_7d, 0);
  const postsToday = accounts.reduce((s, a) => s + a.posts_today, 0);
  const commentsToday = accounts.reduce((s, a) => s + a.comments_today, 0);
  const trackErrors = accounts.filter((a) => a.last_sync_status === "error");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <TrackButton />
      </div>

      <SetupNotice />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Accounts" value={String(accounts.length)} />
        <StatTile
          label="Total karma"
          value={formatKarma(totalKarma)}
          sub={<Delta value={karmaToday} suffix=" today" />}
        />
        <StatTile
          label="Karma this week"
          value={karma7d >= 0 ? `+${formatKarma(karma7d)}` : formatKarma(karma7d)}
        />
        <StatTile label="Posts today" value={String(postsToday)} />
        <StatTile label="Comments today" value={String(commentsToday)} />
      </div>

      {trackErrors.length ? (
        <p
          className="card px-4 py-3 text-sm"
          style={{ color: "var(--warning)" }}
        >
          Karma tracking failed for {trackErrors.length} account
          {trackErrors.length > 1 ? "s" : ""}: {trackErrors[0].last_sync_error}
        </p>
      ) : null}

      <QuickLog accounts={accountList} recent={dailyLog} />

      <section className="card overflow-hidden">
        <h2 className="border-b border-[var(--gridline)] px-4 py-3 text-sm font-semibold">
          Accounts
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-[var(--gridline)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-2.5 font-medium">Account</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="tabular px-3 py-2.5 text-right font-medium">Karma</th>
                <th className="tabular px-3 py-2.5 text-right font-medium">Today</th>
                <th className="tabular px-3 py-2.5 text-right font-medium">7 days</th>
                <th className="tabular px-3 py-2.5 text-right font-medium">
                  Posts today
                </th>
                <th className="tabular px-3 py-2.5 text-right font-medium">
                  Comments today
                </th>
                <th className="px-4 py-2.5 font-medium">Tracked</th>
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
                    {formatKarma(a.total_karma)}
                  </td>
                  <td className="tabular px-3 py-2.5 text-right">
                    <Delta value={a.karma_today} />
                  </td>
                  <td className="tabular px-3 py-2.5 text-right">
                    <Delta value={a.karma_delta_7d} />
                  </td>
                  <td className="tabular px-3 py-2.5 text-right">{a.posts_today}</td>
                  <td className="tabular px-3 py-2.5 text-right">
                    {a.comments_today}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                    {a.last_sync_status === "error" ? (
                      <span style={{ color: "var(--critical)" }}>failed</span>
                    ) : (
                      timeAgo(a.last_tracked_at)
                    )}
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
