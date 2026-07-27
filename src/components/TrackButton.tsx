"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function TrackButton({ accountId }: { accountId?: number }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setBusy(true);
    setNote(null);
    try {
      const url = accountId ? `/api/track?accountId=${accountId}` : "/api/track";
      const res = await fetch(url, { method: "POST" });
      const results = await res.json();
      const failed = Array.isArray(results)
        ? results.filter((r: { ok: boolean }) => !r.ok)
        : [];
      if (failed.length) {
        setNote(failed[0].error ?? "Tracking failed");
      } else if (Array.isArray(results) && results.length) {
        setNote(`Updated ${results.length} account${results.length > 1 ? "s" : ""}`);
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={run}
        disabled={busy}
        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm font-medium hover:bg-[var(--baseline)] disabled:opacity-50"
      >
        <RefreshCw size={14} aria-hidden="true" />
        {busy ? "Checking karma..." : "Track karma now"}
      </button>
      {note ? (
        <span
          className="max-w-md text-right text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          {note}
        </span>
      ) : null}
    </div>
  );
}
