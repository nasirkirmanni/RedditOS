// Background karma bot: checks every account on an interval while the app runs.
import { trackAllAccounts } from "./services/tracker";

const INTERVAL_MS =
  Number(process.env.TRACKER_INTERVAL_MINUTES ?? 60) * 60_000;

// Survive dev-mode hot reloads.
const g = globalThis as unknown as { __redditosTracker?: NodeJS.Timeout };

export function startTracker() {
  // On Vercel the schedule is driven by Vercel Cron (see vercel.json); a
  // long-lived interval would not survive between serverless invocations.
  if (process.env.VERCEL) return;
  if (process.env.TRACKER_DISABLED === "1") return;
  if (g.__redditosTracker) return;
  console.log(`[tracker] karma bot started - every ${INTERVAL_MS / 60_000} min`);
  const run = async () => {
    try {
      const results = await trackAllAccounts();
      if (!results.length) return;
      const failed = results.filter((r) => !r.ok);
      console.log(
        `[tracker] checked ${results.length} account(s)` +
          (failed.length ? ` - ${failed.length} failed: ${failed[0].error}` : "")
      );
    } catch (err) {
      console.error("[tracker] run failed:", err);
    }
  };
  setTimeout(run, 20_000);
  g.__redditosTracker = setInterval(run, INTERVAL_MS);
}
