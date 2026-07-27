import { listSubreddits } from "@/lib/repos/subreddits";
import { getAccountOverviews } from "@/lib/services/overview";
import SubredditManager from "@/components/SubredditManager";

export const dynamic = "force-dynamic";

export default async function SubredditsPage() {
  const [subreddits, accounts] = await Promise.all([
    listSubreddits(),
    getAccountOverviews(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subreddits</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Keep track of which accounts operate in which subreddits.
        </p>
      </div>
      <SubredditManager subreddits={subreddits} accounts={accounts} />
    </div>
  );
}
