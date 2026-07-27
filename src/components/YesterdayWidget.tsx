import type { AccountOverview } from "@/lib/types";

/** Compact count of what was logged yesterday across all accounts. */
export default function YesterdayWidget({
  accounts,
  date,
}: {
  accounts: AccountOverview[];
  date: string;
}) {
  const posts = accounts.reduce((s, a) => s + a.posts_yesterday, 0);
  const comments = accounts.reduce((s, a) => s + a.comments_yesterday, 0);

  return (
    <section className="card flex items-center justify-between gap-4 px-5 py-3">
      <div>
        <h2 className="text-sm font-semibold">Yesterday</h2>
        <p className="tabular text-xs text-[var(--text-muted)]">{date}</p>
      </div>
      <div className="flex items-end gap-6">
        <div className="text-right">
          <p className="tabular text-2xl font-bold leading-none">{posts}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            post{posts === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-right">
          <p className="tabular text-2xl font-bold leading-none">{comments}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            comment{comments === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </section>
  );
}
