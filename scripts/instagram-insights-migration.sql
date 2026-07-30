-- Adds a table to persist Instagram Reels performance metrics over time.
--
-- Root cause: scripts/collect_insights.py pulls per-media metrics (reach,
-- saved, shares, comments, likes, total_interactions) from Instagram's
-- Insights endpoint, but there is no table shaped to store them — every
-- other piece of state in the Python automation lives in R2 as opaque JSON
-- (token caches, DM dedup record), which is fine for "last known value"
-- state but unsuitable for trend analysis across many collection runs over
-- time, which is the whole point of tracking Insights.
--
-- Fix: a narrow (long) metrics table — one row per (media, metric,
-- collection run) rather than fixed wide columns per metric. Meta has
-- changed the set of available Insights metrics for Reels more than once;
-- a narrow table absorbs that without a schema migration, and trend
-- queries (metric over time) are a natural group-by over rows rather than
-- requiring new columns whenever Meta adds/retires a metric.
create extension if not exists "uuid-ossp";

create table if not exists public.instagram_media_insights (
  id uuid primary key default uuid_generate_v4(),
  media_id text not null,
  media_timestamp timestamp with time zone,
  media_caption_excerpt text,
  metric_name text not null,
  metric_value numeric not null,
  collected_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists instagram_media_insights_media_id_idx
  on public.instagram_media_insights(media_id);
create index if not exists instagram_media_insights_collected_at_idx
  on public.instagram_media_insights(collected_at);
create unique index if not exists instagram_media_insights_media_metric_run_idx
  on public.instagram_media_insights(media_id, metric_name, collected_at);

alter table public.instagram_media_insights enable row level security;

-- Service-role only — this table is written exclusively by
-- scripts/collect_insights.py using the service role key, and has no
-- end-user-facing reads (no client-side Supabase queries against it), so
-- no public policy is needed, matching other internal-state tables.
