-- Associate accounts with the subreddits they operate in.
create table public.account_subreddits (
  account_id  bigint not null references public.accounts (id) on delete cascade,
  subreddit   text not null references public.subreddits (name) on delete cascade,
  notes       text,
  created_at  timestamptz not null default now(),
  primary key (account_id, subreddit)
);
create index account_subreddits_subreddit_idx on public.account_subreddits (subreddit);

alter table public.account_subreddits enable row level security;
