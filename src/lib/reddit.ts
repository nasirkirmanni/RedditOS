// Reddit karma reader. Anonymous public JSON only - no OAuth, no credentials,
// nothing stored anywhere.
//
// Note: Reddit blocks anonymous API requests from many networks (it answers with
// a bot-verification page). When that happens the tracker records the failure and
// karma can be entered by hand instead.

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export type RedditKarma = {
  link_karma: number;
  comment_karma: number;
  total_karma: number;
  created_utc: number | null;
  avatar_url: string | null;
};

export class RedditBlockedError extends Error {
  constructor(status: number) {
    super(
      `Reddit refused the request (${status}). This network is blocked from anonymous access - enter karma manually, or run the tracker from a different network.`
    );
    this.name = "RedditBlockedError";
  }
}

/** Fetch public karma for a username. Throws on block / not found. */
export async function fetchKarma(username: string): Promise<RedditKarma> {
  const res = await fetch(
    `https://www.reddit.com/user/${encodeURIComponent(username)}/about.json?raw_json=1`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    }
  );

  if (res.status === 403 || res.status === 429) {
    throw new RedditBlockedError(res.status);
  }
  if (res.status === 404) {
    throw new Error(`u/${username} not found on Reddit.`);
  }
  if (!res.ok) {
    throw new Error(`Reddit returned ${res.status} for u/${username}.`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) {
    // Bot-challenge HTML page instead of JSON.
    throw new RedditBlockedError(res.status);
  }

  const json = await res.json();
  const d = json?.data ?? {};
  if (typeof d.link_karma !== "number" && typeof d.total_karma !== "number") {
    throw new Error(`No karma data returned for u/${username}.`);
  }

  return {
    link_karma: d.link_karma ?? 0,
    comment_karma: d.comment_karma ?? 0,
    total_karma: d.total_karma ?? (d.link_karma ?? 0) + (d.comment_karma ?? 0),
    created_utc: d.created_utc ? Math.floor(d.created_utc) : null,
    avatar_url:
      typeof d.snoovatar_img === "string" && d.snoovatar_img
        ? d.snoovatar_img.split("?")[0]
        : typeof d.icon_img === "string" && d.icon_img
          ? d.icon_img.split("?")[0]
          : null,
  };
}
