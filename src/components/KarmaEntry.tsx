"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import type { AccountOverview } from "@/lib/types";
import Avatar from "@/components/Avatar";
import { formatKarma } from "@/lib/format";

function todayString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const input =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm focus:border-[var(--accent)]";

/** Karma totals for every account in one pass. */
export default function KarmaEntry({ accounts }: { accounts: AccountOverview[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayString());
  const [values, setValues] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const filled = accounts.filter((a) => (values[a.id] ?? "").trim() !== "");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/karma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          entries: filled.map((a) => ({
            account_id: a.id,
            total_karma: values[a.id],
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not save karma");
        return;
      }
      setOk(
        `Recorded karma for ${json.saved} account${json.saved === 1 ? "" : "s"} on ${date}.`
      );
      setValues({});
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm font-medium hover:bg-[var(--baseline)]"
      >
        <Plus size={15} aria-hidden="true" />
        Add karma
      </button>
    );
  }

  return (
    <section className="card px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Add karma</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Enter each account&apos;s current total. Leave an account blank to
            skip it.
          </p>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X size={14} />
        </button>
      </div>

      <form onSubmit={save} className="mt-3">
        <div className="mb-3 max-w-44">
          <label htmlFor="ke-date" className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Date
          </label>
          <input
            id="ke-date"
            type="date"
            value={date}
            max={todayString()}
            onChange={(e) => setDate(e.target.value)}
            className={input}
          />
        </div>

        <ul className="divide-y divide-[var(--gridline)] border-y border-[var(--gridline)]">
          {accounts.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2.5">
              <Avatar username={a.username} url={a.avatar_url} size={28} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">u/{a.username}</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {a.total_karma
                    ? `last recorded ${formatKarma(a.total_karma)}`
                    : "no karma recorded yet"}
                </p>
              </div>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={values[a.id] ?? ""}
                onChange={(e) =>
                  setValues({ ...values, [a.id]: e.target.value })
                }
                placeholder={a.total_karma ? String(a.total_karma) : "0"}
                aria-label={`Karma total for ${a.username}`}
                className={`${input} w-32 shrink-0 text-right`}
              />
            </li>
          ))}
        </ul>

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

        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={busy || filled.length === 0}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {busy
              ? "Saving…"
              : `Save${filled.length ? ` (${filled.length})` : ""}`}
          </button>
          <span className="text-xs text-[var(--text-muted)]">
            {filled.length === 0
              ? "Enter a total for at least one account"
              : `${filled.length} of ${accounts.length} filled in`}
          </span>
        </div>
      </form>
    </section>
  );
}
