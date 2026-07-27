"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { Account } from "@/lib/types";
import type { DailyActivity } from "@/lib/repos/dailyActivity";

function todayString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const input =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm focus:border-[var(--accent)]";
const labelCls = "mb-1 block text-xs font-medium text-[var(--text-secondary)]";

export default function QuickLog({
  accounts,
  recent,
}: {
  accounts: Account[];
  recent: DailyActivity[];
}) {
  const router = useRouter();
  const [accountId, setAccountId] = useState(
    accounts.length === 1 ? String(accounts[0].id) : ""
  );
  const [date, setDate] = useState(todayString());
  const [karma, setKarma] = useState("");
  const [posts, setPosts] = useState("0");
  const [comments, setComments] = useState("0");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Show the account's last recorded karma as a reference point.
  const lastKarma = recent.find(
    (r) => String(r.account_id) === accountId && r.total_karma != null
  )?.total_karma;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/daily-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: Number(accountId),
          activity_date: date,
          posts_count: Number(posts) || 0,
          comments_count: Number(comments) || 0,
          total_karma: karma === "" ? null : Number(karma),
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not save");
        return;
      }
      const name = accounts.find((a) => String(a.id) === accountId)?.username;
      const added: string[] = [];
      if (Number(posts) > 0) added.push(`${posts} post${posts === "1" ? "" : "s"}`);
      if (Number(comments) > 0)
        added.push(`${comments} comment${comments === "1" ? "" : "s"}`);
      if (karma !== "") added.push(`${Number(karma).toLocaleString()} karma`);
      setOk(
        `Added ${added.join(", ") || "entry"} for u/${name} on ${date} - day total is now ${json.posts_count} posts, ${json.comments_count} comments.`
      );
      setKarma("");
      setPosts("0");
      setComments("0");
      setNotes("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    await fetch(`/api/daily-activity/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="card px-5 py-4">
      <h2 className="text-sm font-semibold">Record activity</h2>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
        Log what an account posted, and its current karma total. Every save is
        added to that day - log 3 comments now and 2 later and the day shows 5.
      </p>

      <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label htmlFor="ql-account" className={labelCls}>
            Account
          </label>
          <select
            id="ql-account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className={input}
          >
            <option value="">Select…</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                u/{a.username}
                {a.label ? ` — ${a.label}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ql-date" className={labelCls}>
            Date
          </label>
          <input
            id="ql-date"
            type="date"
            value={date}
            max={todayString()}
            onChange={(e) => setDate(e.target.value)}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="ql-karma" className={labelCls}>
            Total karma
          </label>
          <input
            id="ql-karma"
            type="number"
            min="0"
            value={karma}
            onChange={(e) => setKarma(e.target.value)}
            placeholder={lastKarma != null ? String(lastKarma) : "e.g. 1250"}
            className={input}
          />
          {lastKarma != null ? (
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              last: {lastKarma.toLocaleString()}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="ql-posts" className={labelCls}>
            Posts
          </label>
          <input
            id="ql-posts"
            type="number"
            min="0"
            value={posts}
            onChange={(e) => setPosts(e.target.value)}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="ql-comments" className={labelCls}>
            Comments
          </label>
          <input
            id="ql-comments"
            type="number"
            min="0"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className={input}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-5">
          <label htmlFor="ql-notes" className={labelCls}>
            Notes (optional)
          </label>
          <input
            id="ql-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. 2 posts in r/SEO, rest were replies"
            className={input}
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={busy || !accountId}
            className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      {error ? (
        <p role="alert" className="mt-2 text-sm" style={{ color: "var(--critical)" }}>
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="mt-2 text-sm" style={{ color: "var(--good)" }}>
          {ok}
        </p>
      ) : null}

      {recent.length ? (
        <div className="mt-4 border-t border-[var(--gridline)] pt-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Recent entries
          </h3>
          <ul className="divide-y divide-[var(--gridline)]">
            {recent.slice(0, 8).map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 py-2 text-sm">
                <span
                  className="tabular shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]"
                  style={{ background: "var(--surface-2)" }}
                >
                  #{recent.length - i}
                </span>
                <span className="tabular w-24 shrink-0 text-xs text-[var(--text-muted)]">
                  {r.activity_date}
                </span>
                <span className="w-40 shrink-0 truncate font-medium">
                  u/{r.username}
                </span>
                <span className="tabular text-[var(--text-secondary)]">
                  {r.total_karma != null
                    ? `${r.total_karma.toLocaleString()} karma · `
                    : ""}
                  {r.posts_count} posts · {r.comments_count} comments
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-[var(--text-muted)]">
                  {r.notes ?? ""}
                </span>
                <button
                  onClick={() => remove(r.id)}
                  aria-label={`Delete entry for ${r.username} on ${r.activity_date}`}
                  className="shrink-0 rounded-lg border border-[var(--border)] p-1.5 hover:border-[var(--critical)]"
                  style={{ color: "var(--critical)" }}
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
