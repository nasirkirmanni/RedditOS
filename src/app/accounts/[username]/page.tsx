import { notFound } from "next/navigation";
import { getKarmaHistory } from "@/lib/repos/karma";
import { listDailyActivityForAccount } from "@/lib/repos/dailyActivity";
import { listContent } from "@/lib/repos/content";
import { getAccountOverviewByUsername } from "@/lib/services/overview";
import { formatKarma, formatDate, truncate } from "@/lib/format";
import { StatTile, Delta } from "@/components/StatTile";
import { StatusBadge } from "@/components/Badges";
import Avatar from "@/components/Avatar";
import KarmaChart from "@/components/KarmaChart";

export const dynamic = "force-dynamic";

function accountAge(createdUtc: number | null): string {
  if (!createdUtc) return "unknown age";
  const days = Math.floor((Date.now() / 1000 - createdUtc) / 86400);
  if (days < 365) return `${Math.floor(days / 30)} months old`;
  return `${(days / 365).toFixed(1)} years old`;
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const result = await getAccountOverviewByUsername(decodeURIComponent(username));
  if (!result) notFound();
  const { account, overview } = result;

  const [snapshots, log, content] = await Promise.all([
    getKarmaHistory(account.id),
    listDailyActivityForAccount(account.id),
    listContent(account.id, 100),
  ]);
  const latest = snapshots[snapshots.length - 1];

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center gap-4 px-5 py-4">
        <Avatar username={account.username} url={account.avatar_url} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">u/{account.username}</h1>
            <StatusBadge status={account.status} />
          </div>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            {account.label ? `${account.label} - ` : ""}
            {accountAge(account.reddit_created_utc)} - last entry{" "}
            {overview.last_logged_date ?? "never"}
          </p>
          {overview.subreddits.length ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {overview.subreddits.map((s) => (
                <span
                  key={s}
                  className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[11px] text-[var(--text-secondary)]"
                >
                  r/{s}
                </span>
              ))}
            </div>
          ) : null}
          {account.notes ? (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {account.notes}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Total karma"
          value={formatKarma(latest?.total_karma ?? 0)}
          sub={<Delta value={overview.karma_delta_7d} suffix=" 7d" />}
        />
        <StatTile label="Post karma" value={formatKarma(latest?.link_karma ?? 0)} />
        <StatTile
          label="Comment karma"
          value={formatKarma(latest?.comment_karma ?? 0)}
        />
        <StatTile
          label="Logged activity"
          value={`${overview.post_count} / ${overview.comment_count}`}
          sub={
            <span className="text-[var(--text-muted)]">posts / comments total</span>
          }
        />
      </div>

      <section className="card px-4 py-4">
        <h2 className="mb-2 text-sm font-semibold">Karma over time</h2>
        <KarmaChart snapshots={snapshots} />
      </section>

      <section className="card overflow-hidden">
        <h2 className="border-b border-[var(--gridline)] px-4 py-3 text-sm font-semibold">
          Activity log
        </h2>
        {log.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
            Nothing logged yet. Add entries from the dashboard.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--gridline)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="tabular px-3 py-2 text-right font-medium">Posts</th>
                <th className="tabular px-3 py-2 text-right font-medium">Comments</th>
                <th className="tabular px-3 py-2 text-right font-medium">Karma</th>
                <th className="px-4 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {log.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--gridline)] last:border-0"
                >
                  <td className="tabular px-4 py-2">{r.activity_date}</td>
                  <td className="tabular px-3 py-2 text-right">{r.posts_count}</td>
                  <td className="tabular px-3 py-2 text-right">{r.comments_count}</td>
                  <td className="tabular px-3 py-2 text-right">
                    {r.total_karma != null ? formatKarma(r.total_karma) : "-"}
                  </td>
                  <td className="max-w-0 truncate px-4 py-2 text-xs text-[var(--text-muted)]">
                    {r.notes ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--gridline)] px-4 py-3">
          <h2 className="text-sm font-semibold">Posts &amp; comments</h2>
          {content.length ? (
            <span className="tabular text-xs text-[var(--text-muted)]">
              {content.filter((c) => c.kind === "post").length} posts ·{" "}
              {content.filter((c) => c.kind === "comment").length} comments
            </span>
          ) : null}
        </div>
        {content.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
            No posts or comments written down for this account yet. Use &ldquo;Write
            the post or comment&rdquo; in the dashboard&apos;s activity form.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--gridline)]">
            {content.map((c) => (
              <li key={c.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                    style={{
                      background: "var(--surface-2)",
                      color:
                        c.kind === "post"
                          ? "var(--series-1)"
                          : "var(--series-2)",
                    }}
                  >
                    {c.kind}
                  </span>
                  <div className="min-w-0 flex-1">
                    {c.kind === "post" ? (
                      <>
                        {c.url ? (
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-sm font-medium hover:underline"
                          >
                            {c.title}
                          </a>
                        ) : (
                          <p className="truncate text-sm font-medium">{c.title}</p>
                        )}
                        {c.body ? (
                          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                            {truncate(c.body, 160)}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <p className="text-sm">{truncate(c.body, 200)}</p>
                        {c.title ? (
                          <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                            on: {c.title}
                          </p>
                        ) : null}
                      </>
                    )}
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                      r/{c.subreddit} · {formatDate(c.posted_at)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
