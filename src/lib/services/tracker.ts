// Karma tracker. Fetches public karma for each account and stores a snapshot,
// building the history the charts read. No credentials involved.
import { listAccounts, setSyncResult } from "@/lib/repos/accounts";
import { insertSnapshot } from "@/lib/repos/karma";
import { fetchKarma } from "@/lib/reddit";
import type { Account } from "@/lib/types";

export type TrackResult = {
  accountId: number;
  username: string;
  ok: boolean;
  totalKarma?: number;
  error?: string;
};

export async function trackAccount(account: Account): Promise<TrackResult> {
  try {
    const karma = await fetchKarma(account.username);
    await insertSnapshot({
      account_id: account.id,
      link_karma: karma.link_karma,
      comment_karma: karma.comment_karma,
      total_karma: karma.total_karma,
    });
    await setSyncResult(account.id, {
      ok: true,
      avatar_url: karma.avatar_url,
      reddit_created_utc: karma.created_utc,
    });
    return {
      accountId: account.id,
      username: account.username,
      ok: true,
      totalKarma: karma.total_karma,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await setSyncResult(account.id, { ok: false, error: message });
    return {
      accountId: account.id,
      username: account.username,
      ok: false,
      error: message,
    };
  }
}

/** Track every account except disabled ones, one at a time. */
export async function trackAllAccounts(): Promise<TrackResult[]> {
  const accounts = (await listAccounts()).filter((a) => a.status !== "disabled");
  const results: TrackResult[] = [];
  for (const account of accounts) {
    results.push(await trackAccount(account));
    if (accounts.length > 1) await new Promise((r) => setTimeout(r, 1500));
  }
  return results;
}
