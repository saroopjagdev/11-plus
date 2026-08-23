-- Adds a content_format column to instagram_media_insights so carousel vs.
-- reel performance can be compared.
--
-- Root cause: scripts/instagram-insights-migration.sql created
-- instagram_media_insights as a narrow (long) metrics table — one row per
-- (media, metric, collection run) — with no column recording what kind of
-- post the media actually was. That was fine while every post was a Reel,
-- but the new Instagram carousel automation (scripts/generate_carousel.py,
-- scripts/social_instagram_carousel.py) means this table will start
-- collecting metrics for carousel posts too, and there would be no way to
-- tell them apart in a trend query without this.
--
-- Fix: a single content_format column, populated going forward by
-- scripts/collect_insights.py from the media_type the Graph API already
-- returns for each post (see the comment in collect_insights.py's
-- build_rows()). Existing rows all predate the carousel feature — every
-- post collected so far was a Reel — so they're backfilled to 'reel'
-- rather than left null, and the column defaults to 'reel' for the same
-- reason (a stray insert that forgets to set it is far more likely to be
-- a Reel than a carousel, given the automation's history).
alter table public.instagram_media_insights
  add column if not exists content_format text;

update public.instagram_media_insights
  set content_format = 'reel'
  where content_format is null;

alter table public.instagram_media_insights
  alter column content_format set default 'reel';

-- Loose on purpose (nullable, no NOT NULL) — mirrors how every other
-- column on this table was added: additive and non-blocking so an
-- in-flight collect_insights.py run against the old schema can't fail
-- mid-insert. Constrain to the two known values so a typo doesn't
-- silently create a third bucket that trend queries miss.
alter table public.instagram_media_insights
  drop constraint if exists instagram_media_insights_content_format_check;

alter table public.instagram_media_insights
  add constraint instagram_media_insights_content_format_check
  check (content_format is null or content_format in ('reel', 'carousel'));

create index if not exists instagram_media_insights_content_format_idx
  on public.instagram_media_insights(content_format);
