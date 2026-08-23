-- Adds first-touch UTM/referrer attribution to leads and profiles.
--
-- Context: diagnosing a traffic collapse (Mumsnet apparently gone, Facebook
-- doesn't allow links, Instagram organic reach is real-but-unconverted) turned
-- up that this codebase has never captured where a visitor came from. Every
-- one of the 19 leads ever captured has landing_path='/diagnostic' -- which
-- page they hit, not which channel sent them there. "Mumsnet was our funnel"
-- is a belief, not something the data could confirm or refute. This closes
-- that gap so the next channel decision is measured, not guessed.
--
-- Captured client-side on first page view (src/components/AttributionCapture.tsx)
-- into a first-touch cookie, then persisted server-side at the two points a
-- visitor becomes identifiable: captureLead (diagnostic guests) and signup
-- (everyone, including the homepage-planner path that never touches leads).

alter table public.leads
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists landing_referrer text;

alter table public.profiles
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists landing_referrer text;

create index if not exists leads_utm_source_idx on public.leads(utm_source);
create index if not exists profiles_utm_source_idx on public.profiles(utm_source);
