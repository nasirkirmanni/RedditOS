// Dates in the app's own timezone.
//
// The server runs in UTC (Vercel does), so `new Date()` on the server is a day
// behind a user in IST during their late evening/early morning. Every "today"
// and "yesterday" the app decides must therefore be computed in a fixed zone,
// not in whatever zone the server happens to run in.
//
// Set APP_TIMEZONE to any IANA name to change it.

export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

/** YYYY-MM-DD for an instant, in the app timezone. */
export function toZonedDateString(date: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function todayDateString(): string {
  return toZonedDateString();
}

export function yesterdayDateString(): string {
  return toZonedDateString(new Date(Date.now() - 86400_000));
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** How far the app timezone sits from UTC, in minutes, at a given instant. */
function zoneOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second")
  );
  return (asUtc - at.getTime()) / 60_000;
}

/** Epoch seconds for a wall-clock time on a date, in the app timezone. */
export function zonedEpoch(dateStr: string, hour = 12, minute = 0): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  // Offset is evaluated at the guess, then applied - correct except within a
  // DST transition hour, which India does not observe.
  const offset = zoneOffsetMinutes(new Date(guess));
  return Math.floor((guess - offset * 60_000) / 1000);
}

/** Epoch seconds for midnight at the start of today, in the app timezone. */
export function startOfTodayEpoch(): number {
  return zonedEpoch(todayDateString(), 0, 0);
}
