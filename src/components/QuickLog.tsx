"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { Account } from "@/lib/types";
import type { DailyActivity } from "@/lib/repos/dailyActivity";
import type { ContentItem } from "@/lib/repos/content";
import { formatDate, truncate } from "@/lib/format";

function todayString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const input =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]";
const labelCls = "mb-1 block text-xs font-medium text-[var(--text-secondary)]";

export default function QuickLog({
  accounts,
  recent,
  subreddits,
  content,
}: {
  accounts: Account[];
  recent: DailyActivity[];
  subreddits: string[];
  content: ContentItem[];
}) {
  const router = useRouter();
  const [accountId, setAccountId] = useState(
    accounts.length === 1 ? String(accounts[0].id) : ""
  );
  const [date, setDate] = useState(todayString());
  const [posts, setPosts] = useState("0");
  const [comments, setComments] = useState("0");
  const [notes, setNotes] = useState("");

  // Optional: the text of one of those posts/comments.
  const [showText, setShowText] = useState(false);
  const [kind, setKind] = useState<"post" | "comment">("post");
  const [subreddit, setSubreddit] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const hasText = showText && (title.trim() || text.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      // Writing the text of a post implies at least one of that kind.
      let postCount = Number(posts) || 0;
      let commentCount = Number(comments) || 0;
      if (hasText) {
        if (!subreddit.trim()) {
          setError("Subreddit is required when you write the text.");
          return;
        }
        if (kind === "post" && postCount === 0) postCount = 1;
        if (kind === "comment" && commentCount === 0) commentCount = 1;

        const res = await fetch("/api/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account_id: Number(accountId),
            kind,
            subreddit,
            title,
            body: text,
            url,
            activity_date: date,
            count: false, // the counts below cover it
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error ?? "Could not save the text");
          return;
        }
      }

      const res = await fetch("/api/daily-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: Number(accountId),
          activity_date: date,
          posts_count: postCount,
          comments_count: commentCount,
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not save");
        return;
      }

      const name = accounts.find((a) => String(a.id) === accountId)?.username;
      setOk(
        `Saved for u/${name} on ${date}${hasText ? ` (${kind} text stored)` : ""} - day total is now ${json.posts_count} posts, ${json.comments_count} comments.`
      );
      setPosts("0");
      setComments("0");
      setNotes("");
      setTitle("");
      setText("");
      setUrl("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeEntry(id: number) {
    await fetch(`/api/daily-activity/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function removeContent(id: string) {
    if (!confirm("Delete this saved text? The day's count is not changed."))
      return;
    await fetch(`/api/content/${encodeURIComponent(id)}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="card px-5 py-4">
      <h2 className="text-sm font-semibold">Record activity</h2>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
        Log what an account did that day. Every save is added, so 3 comments now
        and 2 later makes 5.
      </p>

      <form onSubmit={submit} className="mt-3 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
        </div>

        <div>
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

        {/* Optional: keep the actual text of one post or comment */}
        <div className="rounded-lg border border-[var(--gridline)] px-3 py-2.5">
          <button
            type="button"
            onClick={() => setShowText(!showText)}
            aria-expanded={showText}
            className="text-xs font-medium"
            style={{ color: "var(--accent)" }}
          >
            {showText ? "− Hide" : "+ Write the post or comment"}
            <span className="ml-1 font-normal text-[var(--text-muted)]">
              (optional)
            </span>
          </button>

          {showText ? (
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <span className={labelCls}>Type</span>
                  <div className="flex gap-1 rounded-lg border border-[var(--border)] p-1">
                    {(["post", "comment"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKind(k)}
                        aria-pressed={kind === k}
                        className={`flex-1 rounded-md px-2 py-1 text-xs font-semibold capitalize ${
                          kind === k
                            ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
                            : "text-[var(--text-muted)]"
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="ql-sub" className={labelCls}>
                    Subreddit
                  </label>
                  <input
                    id="ql-sub"
                    value={subreddit}
                    onChange={(e) => setSubreddit(e.target.value)}
                    placeholder="SEO"
                    list="ql-subreddits"
                    className={input}
                    autoComplete="off"
                  />
                  <datalist id="ql-subreddits">
                    {subreddits.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label htmlFor="ql-url" className={labelCls}>
                    Link (optional)
                  </label>
                  <input
                    id="ql-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://reddit.com/…"
                    className={input}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ql-title" className={labelCls}>
                  {kind === "post" ? "Title" : "Thread title (optional)"}
                </label>
                <input
                  id="ql-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={input}
                />
              </div>

              <div>
                <label htmlFor="ql-text" className={labelCls}>
                  {kind === "post" ? "Body (optional)" : "Comment"}
                </label>
                <textarea
                  id="ql-text"
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className={input}
                />
              </div>

              <p className="text-[11px] text-[var(--text-muted)]">
                Saving the text counts as one {kind} if you left {kind === "post" ? "Posts" : "Comments"} at 0.
              </p>
            </div>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-sm" style={{ color: "var(--critical)" }}>
            {error}
          </p>
        ) : null}
        {ok ? (
          <p className="text-sm" style={{ color: "var(--good)" }}>
            {ok}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || !accountId}
          className="rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </form>

      {recent.length ? (
        <div className="mt-4 border-t border-[var(--gridline)] pt-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Recent entries
          </h3>
          <ul className="divide-y divide-[var(--gridline)]">
            {recent.slice(0, 6).map((r, i) => (
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
                <span className="w-36 shrink-0 truncate font-medium">
                  u/{r.username}
                </span>
                <span className="tabular min-w-0 flex-1 truncate text-[var(--text-secondary)]">
                  {r.total_karma != null
                    ? `${r.total_karma.toLocaleString()} karma · `
                    : ""}
                  {r.posts_count} posts · {r.comments_count} comments
                  {r.notes ? ` · ${r.notes}` : ""}
                </span>
                <button
                  onClick={() => removeEntry(r.id)}
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

      {content.length ? (
        <div className="mt-4 border-t border-[var(--gridline)] pt-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Saved text
          </h3>
          <ul className="divide-y divide-[var(--gridline)]">
            {content.slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                  style={{
                    background: "var(--surface-2)",
                    color:
                      c.kind === "post" ? "var(--series-1)" : "var(--series-2)",
                  }}
                >
                  {c.kind}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {c.kind === "post" ? c.title : truncate(c.body, 70)}
                </span>
                <span className="shrink-0 text-xs text-[var(--text-muted)]">
                  r/{c.subreddit}
                </span>
                <span className="shrink-0 text-xs text-[var(--text-muted)]">
                  {formatDate(c.posted_at)}
                </span>
                <button
                  onClick={() => removeContent(c.id)}
                  aria-label="Delete saved text"
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
