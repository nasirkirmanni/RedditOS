-- Manual daily activity logging: how many posts/comments an account made on a
-- given day, entered by hand from the dashboard. One row per account per day
-- (upsert on conflict). total_karma is optional — when provided, the app also
-- records a karma_snapshot so growth charts have data.
create table public.daily_activity (
  id              bigint generated always as identity primary key,
  account_id      bigint not null references public.accounts (id) on delete cascade,
  activity_date   date not null,
  posts_count     integer not null default 0 check (posts_count >= 0),
  comments_count  integer not null default 0 check (comments_count >= 0),
  total_karma     integer,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (account_id, activity_date)
);
create index daily_activity_date_idx on public.daily_activity (activity_date desc);

alter table public.daily_activity enable row level security;
