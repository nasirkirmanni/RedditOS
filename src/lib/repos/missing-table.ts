// Tables added by later migrations may not exist yet. Rather than crashing the
// page, treat "table not found" as empty data and let the UI show a setup notice.
import type { PostgrestError } from "@supabase/supabase-js";

export function isMissingTable(error: PostgrestError | null): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST205" || // table not in schema cache
    error.code === "PGRST200" || // embedded relationship not found
    error.code === "42P01" || // undefined_table
    /could not find the table|could not find a relationship|does not exist/i.test(
      error.message ?? ""
    )
  );
}

/** Names of tables a later migration adds; used by the setup banner. */
export const REQUIRED_TABLES = ["daily_activity", "account_subreddits"] as const;

const missing = new Set<string>();

export function noteMissing(table: string) {
  missing.add(table);
}

export function getMissingTables(): string[] {
  return [...missing];
}
