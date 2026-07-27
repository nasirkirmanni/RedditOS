"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { Account } from "@/lib/types";
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

export default function ContentBox({
  accounts,
  subreddits,
  recent,
}: {
  accounts: Account[];
  subreddits: string[];
  recent: ContentItem[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState<"post" | "comment">("post");
  const [accountId, setAccountId] = useState(
    accounts.length === 1 ? String(accounts[0].id) : ""
  );
  const [date, setDate] = useState(todayString());
  const [subreddit, setSubreddit] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
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
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not save");
        return;
      }
      const name = accounts.find((a) => String(a.id) === accountId)?.username;
      setOk(`Saved ${kind} for u/${name} in r/${json.subreddit} (+1 to that day).`);
      setTitle("");
      setText("");
      setUrl("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this entry? The day's count is not changed.")) return;
    await fetch(`/api/content/${encodeURIComponent(id)}`, { method: "DELETE" });
    router.refresh();
  }

  const tab = (k: "post" | "comment") => (
    <button
      key={k}
      type="button"
      onClick={() => setKind(k)}
      aria-pressed={kind === k}
      className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${
        kind === k
          ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      }`}
    >
      {k}
    </button>
  );

  return (
    <section className="card px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Write it down</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Save the actual post or comment. Adds 1 to that day&apos;s count
            automatically.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-[var(--border)] p-1">
          {tab("post")}
          {tab("comment")}
        </div>
      </div>

      <form onSubmit={submit} className="mt-3 space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="cb-account" className={labelCls}>
              Account
            </label>
            <select
              id="cb-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={input}
            >
              <option value="">Select…</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  u/{a.username}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cb-sub" className={labelCls}>
              Subreddit
            </label>
            <input
              id="cb-sub"
              value={subreddit}
              onChange={(e) => setSubreddit(e.target.value)}
              placeholder="SEO"
              list="content-subreddits"
              className={input}
              autoComplete="off"
            />
            <datalist id="content-subreddits">
              {subreddits.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="cb-date" className={labelCls}>
              Date
            </label>
            <input
              id="cb-date"
              type="date"
              value={date}
              max={todayString()}
              onChange={(e) => setDate(e.target.value)}
              className={input}
            />
          </div>
        </div>

        <div>
          <label htmlFor="cb-title" className={labelCls}>
            {kind === "post" ? "Title" : "Post you replied to (optional)"}
          </label>
          <input
            id="cb-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              kind === "post"
                ? "How we grew organic traffic 240%"
                : "Title of the thread"
            }
            className={input}
          />
        </div>

        <div>
          <label htmlFor="cb-body" className={labelCls}>
            {kind === "post" ? "Body (optional)" : "Comment"}
          </label>
          <textarea
            id="cb-body"
            rows={kind === "post" ? 3 : 4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              kind === "post" ? "What the post said…" : "What you wrote…"
            }
            className={input}
          />
        </div>

        <div>
          <label htmlFor="cb-url" className={labelCls}>
            Link (optional)
          </label>
          <input
            id="cb-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.reddit.com/r/…"
            className={input}
            autoComplete="off"
          />
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
          disabled={
            busy ||
            !accountId ||
            !subreddit.trim() ||
            (kind === "post" ? !title.trim() : !text.trim())
          }
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {busy ? "Saving…" : `Save ${kind}`}
        </button>
      </form>

      {recent.length ? (
        <div className="mt-4 border-t border-[var(--gridline)] pt-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Saved content
          </h3>
          <ul className="divide-y divide-[var(--gridline)]">
            {recent.slice(0, 6).map((c) => (
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
                  onClick={() => remove(c.id)}
                  aria-label="Delete saved content"
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
