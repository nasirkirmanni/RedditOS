"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { Subreddit } from "@/lib/repos/subreddits";
import type { AccountOverview } from "@/lib/types";

const input =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]";

export default function SubredditManager({
  subreddits,
  accounts,
}: {
  subreddits: Subreddit[];
  accounts: AccountOverview[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/subreddits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, topic }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not add subreddit");
        return;
      }
      setName("");
      setTopic("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(subName: string, accountCount: number) {
    if (
      !confirm(
        accountCount
          ? `Delete r/${subName}? It will be unassigned from ${accountCount} account${accountCount > 1 ? "s" : ""}.`
          : `Delete r/${subName}?`
      )
    )
      return;
    await fetch(`/api/subreddits?name=${encodeURIComponent(subName)}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  /** Toggle one account's membership of a subreddit. */
  async function toggle(account: AccountOverview, subName: string) {
    const next = account.subreddits.includes(subName)
      ? account.subreddits.filter((s) => s !== subName)
      : [...account.subreddits, subName];
    await fetch(`/api/accounts/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subreddits: next }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <section className="card px-5 py-4">
        <h2 className="text-sm font-semibold">Add subreddit</h2>
        <form onSubmit={add} className="mt-3 flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Subreddit name (without r/)"
            aria-label="Subreddit name"
            className={`${input} min-w-48 flex-1`}
            autoComplete="off"
          />
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic (optional)"
            aria-label="Topic"
            className={`${input} min-w-40 flex-1`}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {busy ? "Adding..." : "Add"}
          </button>
        </form>
        {error ? (
          <p role="alert" className="mt-2 text-sm" style={{ color: "var(--critical)" }}>
            {error}
          </p>
        ) : null}
      </section>

      {subreddits.length === 0 ? (
        <div className="card px-4 py-10 text-center text-sm text-[var(--text-muted)]">
          No subreddits yet. Add one above, or type them when adding an account.
        </div>
      ) : (
        <div className="space-y-3">
          {subreddits.map((s) => (
            <section key={s.name} className="card px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">r/{s.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {s.topic ?? "no topic"} - {s.accounts.length} account
                    {s.accounts.length === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  onClick={() => remove(s.name, s.accounts.length)}
                  aria-label={`Delete r/${s.name}`}
                  className="shrink-0 rounded-lg border border-[var(--border)] p-1.5 hover:border-[var(--critical)]"
                  style={{ color: "var(--critical)" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="mt-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Accounts using this subreddit
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {accounts.map((a) => {
                    const on = a.subreddits.includes(s.name);
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggle(a, s.name)}
                        aria-pressed={on}
                        className="rounded-full border px-2.5 py-1 text-xs font-medium"
                        style={{
                          borderColor: on ? "var(--accent)" : "var(--border)",
                          color: on ? "var(--accent)" : "var(--text-muted)",
                          background: on ? "var(--surface-2)" : "transparent",
                        }}
                      >
                        u/{a.username}
                      </button>
                    );
                  })}
                  {accounts.length === 0 ? (
                    <Link
                      href="/accounts"
                      className="text-xs underline"
                      style={{ color: "var(--accent)" }}
                    >
                      Add an account first
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
