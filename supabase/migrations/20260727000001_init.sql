-- RedditOS — initial schema (v3, reviewed design)
-- Cloud-first, server-only access (secret key). RLS enabled everywhere with NO
-- policies: the publishable key can see nothing; the service role bypasses.
-- accounts is METADATA-ONLY: every credential (password, client id/secret,
-- refresh token, cookie, ...) lives exclusively in Supabase Vault via secret_refs.

-- ============================================================ accounts
create table public.accounts (
  id                 bigint generated always as identity primary key,
  username           text not null unique,
  label              text,             -- friendly display name: "SEO", "Dubai", "Testing"
  notes              text,
  status             text not null default 'active'
                     check (status in ('active', 'resting', 'suspended', 'disabled')),
  auth_mode          text not null default 'public' check (auth_mode in ('public', 'oauth')),
  avatar_url         text,
  reddit_created_at  timestamptz,
  owner_id           uuid,             -- future auth: references auth.users(id); dormant for now
  created_at         timestamptz not null default now(),
  last_sync_at       timestamptz,
  last_sync_status   text check (last_sync_status in ('ok', 'error')),
  last_sync_error    text
);
create index accounts_status_idx on public.accounts (status);

-- ============================================================ projects
-- Normalized grouping ("ORL Media", "Personal", "Testing"); accounts may belong
-- to multiple projects via account_projects.
create table public.projects (
  id           bigint generated always as identity primary key,
  name         text not null unique,
  description  text,
  created_at   timestamptz not null default now()
);

create table public.account_projects (
  account_id  bigint not null references public.accounts (id) on delete cascade,
  project_id  bigint not null references public.projects (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (account_id, project_id)
);
create index account_projects_project_idx on public.account_projects (project_id);

-- ============================================================ posts
create table public.posts (
  id               text primary key,   -- reddit fullname t3_...
  account_id       bigint not null references public.accounts (id) on delete cascade,
  subreddit        text not null,
  title            text not null,
  selftext         text,
  url              text,
  permalink        text not null,
  score            integer not null default 0,
  num_comments     integer not null default 0,
  posted_at        timestamptz not null,
  edited           boolean not null default false,
  removed          boolean not null default false,
  first_seen_at    timestamptz not null default now(),
  last_checked_at  timestamptz not null default now()
);
create index posts_account_posted_idx on public.posts (account_id, posted_at desc);
create index posts_subreddit_idx on public.posts (subreddit);
create index posts_posted_at_idx on public.posts (posted_at);  -- posting-time analytics

-- ============================================================ comments
create table public.comments (
  id               text primary key,   -- reddit fullname t1_...
  account_id       bigint not null references public.accounts (id) on delete cascade,
  subreddit        text not null,
  body             text not null,
  link_title       text,
  permalink        text not null,
  score            integer not null default 0,
  posted_at        timestamptz not null,
  edited           boolean not null default false,
  removed          boolean not null default false,
  first_seen_at    timestamptz not null default now(),
  last_checked_at  timestamptz not null default now()
);
create index comments_account_posted_idx on public.comments (account_id, posted_at desc);
create index comments_subreddit_idx on public.comments (subreddit);
create index comments_posted_at_idx on public.comments (posted_at);

-- ============================================================ karma_snapshots
create table public.karma_snapshots (
  id             bigint generated always as identity primary key,
  account_id     bigint not null references public.accounts (id) on delete cascade,
  link_karma     integer not null,
  comment_karma  integer not null,
  total_karma    integer not null,
  taken_at       timestamptz not null default now()
);
create index karma_snapshots_account_taken_idx on public.karma_snapshots (account_id, taken_at);

-- ============================================================ item_score_history
-- Per-post/per-comment score over time (one row per item per sync).
create table public.item_score_history (
  id          bigint generated always as identity primary key,
  account_id  bigint not null references public.accounts (id) on delete cascade,
  item_id     text not null,
  item_kind   text not null check (item_kind in ('post', 'comment')),
  score       integer not null,
  taken_at    timestamptz not null default now()
);
create index item_score_history_item_idx on public.item_score_history (item_id, taken_at);
create index item_score_history_account_idx on public.item_score_history (account_id, taken_at);

-- ============================================================ sync_log
create table public.sync_log (
  id            bigint generated always as identity primary key,
  account_id    bigint not null references public.accounts (id) on delete cascade,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  new_posts     integer not null default 0,
  new_comments  integer not null default 0,
  status        text not null default 'running' check (status in ('running', 'ok', 'error')),
  error         text
);
create index sync_log_account_idx on public.sync_log (account_id, started_at desc);

-- ============================================================ subreddits
-- Editable reference data per community (feeds the Subreddits page and AI modules).
create table public.subreddits (
  name        text primary key,        -- without the r/ prefix
  topic       text,
  min_karma   integer,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================ insights
-- Durable storage for AI-generated output (summaries, health reports, suggestions).
create table public.insights (
  id            bigint generated always as identity primary key,
  kind          text not null,         -- 'weekly_summary' | 'monthly_summary' | 'account_health' | 'suggestion' | ...
  account_id    bigint references public.accounts (id) on delete cascade,  -- null = fleet-wide
  subreddit     text,
  period_start  date,
  period_end    date,
  title         text,
  content       jsonb not null default '{}'::jsonb,
  model         text,                  -- which model/agent produced it
  created_at    timestamptz not null default now()
);
create index insights_kind_idx on public.insights (kind, created_at desc);
create index insights_account_idx on public.insights (account_id, created_at desc);

-- ============================================================ settings
create table public.settings (
  key    text primary key,
  value  text not null
);

-- ============================================================ secret_refs
-- Maps app/account-scoped secret kinds to Vault entries. Stores only UUIDs —
-- secret values exist solely inside vault.secrets (encrypted at rest).
create table public.secret_refs (
  id               bigint generated always as identity primary key,
  scope            text not null check (scope in ('app', 'account')),
  account_id       bigint references public.accounts (id) on delete cascade,
  kind             text not null,     -- 'password' | 'client_id' | 'client_secret' | 'refresh_token' | 'cookie' | ...
  vault_secret_id  uuid not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint secret_refs_scope_account check (
    (scope = 'app' and account_id is null) or (scope = 'account' and account_id is not null)
  ),
  unique nulls not distinct (scope, account_id, kind)
);

-- ============================================================ row level security
-- Enabled with no policies: publishable/anon keys get nothing; service role bypasses.
alter table public.accounts            enable row level security;
alter table public.projects            enable row level security;
alter table public.account_projects    enable row level security;
alter table public.posts               enable row level security;
alter table public.comments            enable row level security;
alter table public.karma_snapshots     enable row level security;
alter table public.item_score_history  enable row level security;
alter table public.sync_log            enable row level security;
alter table public.subreddits          enable row level security;
alter table public.insights            enable row level security;
alter table public.settings            enable row level security;
alter table public.secret_refs         enable row level security;

-- ============================================================ vault access (service-role only)
-- Vault cleanup when a secret_ref row is deleted (covers account cascade deletes).
create or replace function public.secret_refs_cleanup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from vault.secrets where id = old.vault_secret_id;
  return old;
end;
$$;

create trigger secret_refs_cleanup_trg
  after delete on public.secret_refs
  for each row execute function public.secret_refs_cleanup();

-- Upsert a secret. scope='app' uses account_id null.
create or replace function public.set_secret(
  p_scope text,
  p_account_id bigint,
  p_kind text,
  p_value text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ref public.secret_refs%rowtype;
  v_name text;
  v_id uuid;
begin
  v_name := p_scope || ':' || coalesce(p_account_id::text, '-') || ':' || p_kind;

  select * into v_ref
  from public.secret_refs
  where scope = p_scope
    and account_id is not distinct from p_account_id
    and kind = p_kind;

  if found then
    perform vault.update_secret(v_ref.vault_secret_id, p_value, v_name);
    update public.secret_refs set updated_at = now() where id = v_ref.id;
  else
    v_id := vault.create_secret(p_value, v_name);
    insert into public.secret_refs (scope, account_id, kind, vault_secret_id)
    values (p_scope, p_account_id, p_kind, v_id);
  end if;
end;
$$;

-- Read a secret (null if absent).
create or replace function public.get_secret(
  p_scope text,
  p_account_id bigint,
  p_kind text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  select ds.decrypted_secret into v_secret
  from public.secret_refs sr
  join vault.decrypted_secrets ds on ds.id = sr.vault_secret_id
  where sr.scope = p_scope
    and sr.account_id is not distinct from p_account_id
    and sr.kind = p_kind;
  return v_secret;
end;
$$;

-- Delete a secret (trigger removes the Vault row).
create or replace function public.delete_secret(
  p_scope text,
  p_account_id bigint,
  p_kind text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.secret_refs
  where scope = p_scope
    and account_id is not distinct from p_account_id
    and kind = p_kind;
end;
$$;

-- Only the server (service role) may touch secrets.
revoke execute on function public.set_secret(text, bigint, text, text) from public, anon, authenticated;
revoke execute on function public.get_secret(text, bigint, text) from public, anon, authenticated;
revoke execute on function public.delete_secret(text, bigint, text) from public, anon, authenticated;
grant execute on function public.set_secret(text, bigint, text, text) to service_role;
grant execute on function public.get_secret(text, bigint, text) to service_role;
grant execute on function public.delete_secret(text, bigint, text) to service_role;
