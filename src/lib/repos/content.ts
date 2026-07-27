// Actual post/comment content written by an account, stored in the posts and
// comments tables. Entered by hand - ids are generated locally.
import { getSupabase } from "@/lib/supabase";
import { toEpochRequired, toIso } from "@/lib/types";
import { isMissingTable, noteMissing } from "./missing-table";

export type ContentItem = {
  id: string;
  kind: "post" | "comment";
  account_id: number;
  username?: string;
  subreddit: string;
  title: string; // post title, or the parent post title for a comment
  body: string;
  url: string | null;
  posted_at: number;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapPost(row: any): ContentItem {
  return {
    id: row.id,
    kind: "post",
    account_id: row.account_id,
    username: row.accounts?.username,
    subreddit: row.subreddit,
    title: row.title ?? "",
    body: row.selftext ?? "",
    url: row.url || null,
    posted_at: toEpochRequired(row.posted_at),
  };
}

function mapComment(row: any): ContentItem {
  return {
    id: row.id,
    kind: "comment",
    account_id: row.account_id,
    username: row.accounts?.username,
    subreddit: row.subreddit,
    title: row.link_title ?? "",
    body: row.body ?? "",
    url: null,
    posted_at: toEpochRequired(row.posted_at),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function newId(kind: "post" | "comment"): string {
  const prefix = kind === "post" ? "t3" : "t1";
  return `${prefix}_manual_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export async function addContent(input: {
  account_id: number;
  kind: "post" | "comment";
  subreddit: string;
  title: string;
  body: string;
  url?: string | null;
  posted_at: number; // epoch seconds
}): Promise<ContentItem> {
  const db = getSupabase();
  const id = newId(input.kind);
  const when = toIso(input.posted_at);

  if (input.kind === "post") {
    const { data, error } = await db
      .from("posts")
      .insert({
        id,
        account_id: input.account_id,
        subreddit: input.subreddit,
        title: input.title,
        selftext: input.body || null,
        url: input.url || null,
        permalink: input.url || "",
        posted_at: when,
      })
      .select("*, accounts(username)")
      .single();
    if (error) throw new Error(`post save failed: ${error.message}`);
    return mapPost(data);
  }

  const { data, error } = await db
    .from("comments")
    .insert({
      id,
      account_id: input.account_id,
      subreddit: input.subreddit,
      body: input.body,
      link_title: input.title || null,
      permalink: input.url || "",
      posted_at: when,
    })
    .select("*, accounts(username)")
    .single();
  if (error) throw new Error(`comment save failed: ${error.message}`);
  return mapComment(data);
}

/** Recent content across both tables, newest first. */
export async function listContent(
  accountId: number | null,
  limit = 50
): Promise<ContentItem[]> {
  const db = getSupabase();
  let postsQ = db
    .from("posts")
    .select("*, accounts(username)")
    .order("posted_at", { ascending: false })
    .limit(limit);
  let commentsQ = db
    .from("comments")
    .select("*, accounts(username)")
    .order("posted_at", { ascending: false })
    .limit(limit);
  if (accountId) {
    postsQ = postsQ.eq("account_id", accountId);
    commentsQ = commentsQ.eq("account_id", accountId);
  }

  const [posts, comments] = await Promise.all([postsQ, commentsQ]);
  if (isMissingTable(posts.error) || isMissingTable(comments.error)) {
    noteMissing("posts");
    return [];
  }
  if (posts.error) throw new Error(`content read failed: ${posts.error.message}`);
  if (comments.error) {
    throw new Error(`content read failed: ${comments.error.message}`);
  }

  return [
    ...(posts.data ?? []).map(mapPost),
    ...(comments.data ?? []).map(mapComment),
  ]
    .sort((a, b) => b.posted_at - a.posted_at)
    .slice(0, limit);
}

export async function deleteContent(id: string): Promise<boolean> {
  const table = id.startsWith("t3_") ? "posts" : "comments";
  const { error, count } = await getSupabase()
    .from(table)
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(`content delete failed: ${error.message}`);
  return (count ?? 0) > 0;
}
