"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, Pencil, Check, X } from "lucide-react";
import type { AccountOverview, ManagementStatus } from "@/lib/types";
import { formatKarma } from "@/lib/format";
import Avatar from "@/components/Avatar";
import { StatusBadge } from "@/components/Badges";
import { Delta } from "@/components/StatTile";

const STATUSES: ManagementStatus[] = ["active", "resting", "suspended", "disabled"];

const input =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]";
const labelCls = "mb-1 block text-xs font-medium text-[var(--text-secondary)]";

export default function AccountManager({
  accounts,
  knownSubreddits,
}: {
  accounts: AccountOverview[];
  knownSubreddits: string[];
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [label, setLabel] = useState("");
  const [subs, setSubs] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // inline subreddit editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSubs, setEditSubs] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, label, notes, subreddits: subs }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not add account");
        return;
      }
      setUsername("");
      setLabel("");
      setSubs("");
      setNotes("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: number, payload: Record<string, unknown>) {
    await fetch(`/api/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    router.refresh();
  }

  async function remove(id: number, name: string) {
    if (!confirm(`Remove u/${name}? Its karma history and logs are deleted too.`))
      return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <section className="card px-5 py-4">
        <h2 className="text-sm font-semibold">Add account</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Username only - no password, no verification.
        </p>
        <form onSubmit={add} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="am-username" className={labelCls}>
              Username
            </label>
            <input
              id="am-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className={input}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="am-label" className={labelCls}>
              Label
            </label>
            <input
              id="am-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. SEO, Dubai"
              className={input}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="am-subs" className={labelCls}>
              Subreddits
            </label>
            <input
              id="am-subs"
              value={subs}
              onChange={(e) => setSubs(e.target.value)}
              placeholder="SEO, marketing"
              className={input}
              list="known-subreddits"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="am-notes" className={labelCls}>
              Notes
            </label>
            <input
              id="am-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={input}
              autoComplete="off"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={busy || !username.trim()}
              className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {busy ? "Adding..." : "Add account"}
            </button>
          </div>
        </form>
        <datalist id="known-subreddits">
          {knownSubreddits.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        {error ? (
          <p role="alert" className="mt-2 text-sm" style={{ color: "var(--critical)" }}>
            {error}
          </p>
        ) : null}
      </section>

      {accounts.length === 0 ? (
        <div className="card px-4 py-10 text-center text-sm text-[var(--text-muted)]">
          No accounts yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((a) => (
            <div key={a.id} className="card px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/accounts/${a.username}`}
                  className="flex min-w-0 items-center gap-3 hover:underline"
                >
                  <Avatar username={a.username} url={a.avatar_url} size={40} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">u/{a.username}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">
                      {a.label ?? "no label"}
                    </p>
                  </div>
                </Link>
                <StatusBadge status={a.status} />
              </div>

              <div className="mt-3 flex items-end justify-between border-y border-[var(--gridline)] py-3">
                <div>
                  <p className="tabular text-xl font-bold">
                    {a.total_karma ? formatKarma(a.total_karma) : "-"}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">total karma</p>
                </div>
                <div className="text-right text-xs">
                  <Delta value={a.karma_delta_7d} suffix=" this week" />
                  <p className="mt-0.5 text-[var(--text-muted)]">
                    {a.post_count} posts · {a.comment_count} comments logged
                  </p>
                </div>
              </div>

              {/* Subreddits */}
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Subreddits
                  </span>
                  {editingId === a.id ? null : (
                    <button
                      onClick={() => {
                        setEditingId(a.id);
                        setEditSubs(a.subreddits.join(", "));
                      }}
                      aria-label={`Edit subreddits for ${a.username}`}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
                {editingId === a.id ? (
                  <div className="flex gap-1.5">
                    <input
                      value={editSubs}
                      onChange={(e) => setEditSubs(e.target.value)}
                      placeholder="SEO, marketing"
                      list="known-subreddits"
                      aria-label="Subreddits, comma separated"
                      className={input}
                      autoFocus
                    />
                    <button
                      onClick={async () => {
                        await patch(a.id, { subreddits: editSubs });
                        setEditingId(null);
                      }}
                      aria-label="Save subreddits"
                      className="shrink-0 rounded-lg border border-[var(--border)] px-2"
                      style={{ color: "var(--good)" }}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel"
                      className="shrink-0 rounded-lg border border-[var(--border)] px-2 text-[var(--text-muted)]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : a.subreddits.length ? (
                  <div className="flex flex-wrap gap-1">
                    {a.subreddits.map((s) => (
                      <span
                        key={s}
                        className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[11px] text-[var(--text-secondary)]"
                      >
                        r/{s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">None assigned</p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <select
                  value={a.status}
                  onChange={(e) => patch(a.id, { status: e.target.value })}
                  aria-label={`Status for ${a.username}`}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-xs capitalize"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[var(--text-muted)]">
                  last entry {a.last_logged_date ?? "never"}
                </span>
                <button
                  onClick={() => remove(a.id, a.username)}
                  aria-label={`Remove ${a.username}`}
                  className="rounded-lg border border-[var(--border)] p-1.5 hover:border-[var(--critical)]"
                  style={{ color: "var(--critical)" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
