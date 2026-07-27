import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const db = getSupabase();
  const [accounts, projects, accountProjects, subreddits, accountSubreddits, snapshots, daily] =
    await Promise.all([
      db.from("accounts").select("*"),
      db.from("projects").select("*"),
      db.from("account_projects").select("*"),
      db.from("subreddits").select("*"),
      db.from("account_subreddits").select("*"),
      db.from("karma_snapshots").select("*"),
      db.from("daily_activity").select("*"),
    ]);

  const data = {
    exported_at: new Date().toISOString(),
    accounts: accounts.data ?? [],
    projects: projects.data ?? [],
    account_projects: accountProjects.data ?? [],
    subreddits: subreddits.data ?? [],
    account_subreddits: accountSubreddits.data ?? [],
    karma_snapshots: snapshots.data ?? [],
    daily_activity: daily.data ?? [],
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="redditos-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
