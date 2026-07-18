-- Pins "today's missions" so they don't silently reshuffle mid-day.
--
-- Root cause: the dashboard previously called getStudentRecommendations()
-- fresh on every page load, which picks the 3 mission topics from *live*
-- topic_mastery data (weakest topic first, etc). Completing a mission
-- updates that same topic_mastery data, which can change which topic the
-- recommendation algorithm picks next render — so a child could complete a
-- real mission, have the dashboard silently swap that slot to a different
-- topic, and see "not done yet" for something they never actually attempted.
--
-- Fix: persist the day's 3 missions the first time they're computed, and
-- reuse that pinned set for the rest of the day instead of recomputing.
alter table public.children
  add column if not exists daily_mission_date date,
  add column if not exists daily_mission_topics jsonb;
