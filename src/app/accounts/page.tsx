import { getAccountOverviews } from "@/lib/services/overview";
import { listSubreddits } from "@/lib/repos/subreddits";
import AccountManager from "@/components/AccountManager";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const [accounts, subreddits] = await Promise.all([
    getAccountOverviews(),
    listSubreddits(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
      <AccountManager
        accounts={accounts}
        knownSubreddits={subreddits.map((s) => s.name)}
      />
    </div>
  );
}
