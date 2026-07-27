// App-level domain types. Repositories normalize Supabase rows (timestamptz ISO
// strings) into these - timestamps are epoch SECONDS throughout the app.

export type ManagementStatus = "active" | "resting" | "suspended" | "disabled";

export type Project = {
  id: number;
  name: string;
  description: string | null;
  created_at: number;
  account_count?: number;
};

export type Account = {
  id: number;
  username: string;
  label: string | null;
  notes: string | null;
  status: ManagementStatus;
  avatar_url: string | null;
  reddit_created_utc: number | null;
  created_at: number;
  projects: { id: number; name: string }[];
};

export type KarmaSnapshot = {
  id: number;
  account_id: number;
  link_karma: number;
  comment_karma: number;
  total_karma: number;
  taken_at: number;
};

export type AccountOverview = Account & {
  subreddits: string[];
  total_karma: number;
  link_karma: number;
  comment_karma: number;
  karma_delta_7d: number;
  karma_today: number;
  post_count: number;
  comment_count: number;
  posts_today: number;
  comments_today: number;
  posts_yesterday: number;
  comments_yesterday: number;
  last_logged_date: string | null;
};

// ---- conversion helpers used by repositories ----

export function toEpoch(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.floor(new Date(iso).getTime() / 1000);
}

export function toEpochRequired(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

export function toIso(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toISOString();
}
