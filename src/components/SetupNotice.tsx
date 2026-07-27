import { getSupabase } from "@/lib/supabase";
import { isMissingTable } from "@/lib/repos/missing-table";

const REQUIRED = [
  {
    table: "daily_activity",
    what: "logging posts/comments per day",
  },
  {
    table: "account_subreddits",
    what: "assigning subreddits to accounts",
  },
];

/** Checks for tables added by later migrations and explains how to create them. */
export default async function SetupNotice() {
  const db = getSupabase();
  const results = await Promise.all(
    REQUIRED.map(async (r) => {
      // A plain select (not head) returns a parseable error body when the
      // table is absent; HEAD requests come back empty and look like success.
      const { error } = await db.from(r.table).select("*").limit(1);
      return { ...r, missing: isMissingTable(error) };
    })
  );
  const missing = results.filter((r) => r.missing);
  if (!missing.length) return null;

  return (
    <div
      className="card px-5 py-4"
      style={{ borderColor: "var(--warning)" }}
    >
      <p className="text-sm font-semibold" style={{ color: "var(--warning)" }}>
        Database setup needed
      </p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {missing.map((m) => m.table).join(" and ")}{" "}
        {missing.length > 1 ? "tables are" : "table is"} missing, so{" "}
        {missing.map((m) => m.what).join(" and ")}{" "}
        {missing.length > 1 ? "are" : "is"} unavailable. Run the SQL from{" "}
        <code className="rounded bg-[var(--surface-2)] px-1 py-0.5 text-xs">
          supabase/migrations/
        </code>{" "}
        in your Supabase SQL Editor, then reload.
      </p>
      <p className="mt-1.5 text-xs text-[var(--text-muted)]">
        Everything else on this page works normally.
      </p>
    </div>
  );
}
