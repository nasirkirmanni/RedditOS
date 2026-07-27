import { getAccountOverviews } from "@/lib/services/overview";
import { listSubreddits } from "@/lib/repos/subreddits";
import AccountManager from "@/components/AccountManager";
import TrackButton from "@/components/TrackButton";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const [accounts, subreddits] = await Promise.all([
    getAccountOverviews(),
    listSubreddits(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
        <TrackButton />
      </div>
      <AccountManager
        accounts={accounts}
        knownSubreddits={subreddits.map((s) => s.name)}
      />
    </div>
  );
}
