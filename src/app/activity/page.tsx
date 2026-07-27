import { listDailyActivity } from "@/lib/repos/dailyActivity";
import { formatKarma } from "@/lib/format";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const rows = await listDailyActivity(365);

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Activity log</h1>
        <EmptyState
          title="Nothing logged yet"
          message="Record how many posts and comments each account made, from the dashboard."
          actionHref="/"
          actionLabel="Go to dashboard"
        />
      </div>
    );
  }

  const totals = rows.reduce(
    (acc, r) => ({
      posts: acc.posts + r.posts_count,
      comments: acc.comments + r.comments_count,
    }),
    { posts: 0, comments: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity log</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {totals.posts} posts and {totals.comments} comments logged across{" "}
          {rows.length} entries.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-[var(--gridline)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium">Account</th>
                <th className="tabular px-3 py-2.5 text-right font-medium">Posts</th>
                <th className="tabular px-3 py-2.5 text-right font-medium">
                  Comments
                </th>
                <th className="tabular px-3 py-2.5 text-right font-medium">Karma</th>
                <th className="px-4 py-2.5 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--gridline)] last:border-0 hover:bg-[var(--surface-2)]"
                >
                  <td className="tabular whitespace-nowrap px-4 py-2.5">
                    {r.activity_date}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/accounts/${r.username}`}
                      className="font-medium hover:underline"
                    >
                      u/{r.username}
                    </Link>
                  </td>
                  <td className="tabular px-3 py-2.5 text-right">{r.posts_count}</td>
                  <td className="tabular px-3 py-2.5 text-right">
                    {r.comments_count}
                  </td>
                  <td className="tabular px-3 py-2.5 text-right text-[var(--text-secondary)]">
                    {r.total_karma != null ? formatKarma(r.total_karma) : "-"}
                  </td>
                  <td className="max-w-0 truncate px-4 py-2.5 text-xs text-[var(--text-muted)]">
                    {r.notes ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
