"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Pencil } from "lucide-react";
import { formatKarma } from "@/lib/format";

function todayString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * The karma cell in the accounts table. Click it, type the account's current
 * total, press Enter. Saving records today's value, so the growth chart still
 * gets a point each time it changes.
 */
export default function EditableKarma({
  accountId,
  username,
  karma,
}: {
  accountId: number;
  username: string;
  karma: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(karma ? String(karma) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function save() {
    const n = Number(value);
    if (value.trim() === "" || !Number.isInteger(n) || n < 0) {
      setError(true);
      return;
    }
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/karma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayString(),
          entries: [{ account_id: accountId, total_karma: n }],
        }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setValue(karma ? String(karma) : "");
          setEditing(true);
        }}
        title={`Edit karma for ${username}`}
        className="group inline-flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-[var(--surface-2)]"
      >
        <span className="tabular font-semibold">
          {karma ? formatKarma(karma) : "-"}
        </span>
        <Pencil
          size={11}
          className="opacity-0 transition-opacity group-hover:opacity-60"
          aria-hidden="true"
        />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number"
        min="0"
        value={value}
        autoFocus
        disabled={busy}
        onChange={(e) => {
          setValue(e.target.value);
          setError(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        aria-label={`Karma total for ${username}`}
        className="tabular w-24 rounded-lg border bg-[var(--surface-2)] px-2 py-1 text-right text-sm"
        style={{ borderColor: error ? "var(--critical)" : "var(--accent)" }}
      />
      <button
        onClick={save}
        disabled={busy}
        aria-label="Save karma"
        className="rounded border border-[var(--border)] p-1 disabled:opacity-50"
        style={{ color: "var(--good)" }}
      >
        <Check size={13} />
      </button>
      <button
        onClick={() => setEditing(false)}
        aria-label="Cancel"
        className="rounded border border-[var(--border)] p-1 text-[var(--text-muted)]"
      >
        <X size={13} />
      </button>
    </span>
  );
}
