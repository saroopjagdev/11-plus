-- Supports the signup-funnel repair: child-at-signup, onboarding capture,
-- first-party funnel analytics, and the childless-user email nudge.
--
-- Context: 70 signups produced 3-4 trials. The measured wall is 54 signed-in
-- users -> 31 with a child profile. Without a child row the product does
-- nothing, and `processAutomatedEmails()` skips childless profiles entirely,
-- so those users were never even contacted.
--
-- Two things this migration deliberately does NOT do:
--
--   1. It does not loosen RLS on `children`. The signup-time child insert was
--      being rejected by the existing INSERT policy (`auth.uid() = parent_id`)
--      because email confirmation is enabled, so `auth.signUp` returns a user
--      but no session and the write ran as the anon role. Verified directly
--      against production: an anon insert returns
--      `42501 new row violates row-level security policy for table "children"`.
--      The fix is to perform that one write with the service-role client (see
--      upsertStarterChildProfile in src/app/actions/auth.ts), not to let
--      anonymous callers create child rows.
--
--   2. It does not invent the email columns. All five already exist in the
--      live database but appear in no SQL in this repo -- they were added
--      out-of-band via the dashboard. The statements below are idempotent and
--      exist so the repo stops misrepresenting the schema; on the live
--      database they are no-ops.

-- 1. Email consent + throttling columns (already live; declared here for parity).
--    Defaults confirmed against production: handle_new_user() inserts only
--    id/email/role, and all existing profiles have both consent flags true,
--    so the live defaults are true.
alter table public.profiles
  add column if not exists email_consent_weekly boolean default true,
  add column if not exists email_consent_nudges boolean default true,
  add column if not exists last_weekly_report_at timestamp with time zone,
  add column if not exists last_inactivity_nudge_at timestamp with time zone,
  add column if not exists last_report_sent_at timestamp with time zone;

-- 2. Throttle for the new "finish setting up" nudge sent to profiles that have
--    no child yet. Separate column so it can never interfere with the weekly
--    report or inactivity cadences.
alter table public.profiles
  add column if not exists last_setup_nudge_at timestamp with time zone;

-- 3. The onboarding modal's "identify weak spots" step has always collected
--    answers into local state and discarded them. Give them somewhere to land.
alter table public.children
  add column if not exists focus_areas text[] default '{}';

-- 4. Funnel analytics. Narrow/long (one row per event) rather than wide
--    columns per stage: the funnel will change shape as the product does, and
--    a long table absorbs new event names without a migration each time --
--    same reasoning as instagram_media_insights.
--
--    Duplicates are tolerated by design. Several write sites sit on
--    force-dynamic pages or in actions that can legitimately run twice, and
--    keeping the write path dumb (no upsert, no uniqueness) means
--    instrumentation can never fail a user request. Dedupe at read time with
--    `select distinct on (user_id, event_name) ... order by user_id,
--    event_name, created_at`.
create table if not exists public.funnel_events (
  id uuid primary key default uuid_generate_v4(),
  event_name text not null,
  user_id uuid references auth.users(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  properties jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists funnel_events_event_name_idx
  on public.funnel_events(event_name);
create index if not exists funnel_events_user_id_idx
  on public.funnel_events(user_id);
create index if not exists funnel_events_created_at_idx
  on public.funnel_events(created_at);

-- Service-role only: written exclusively by src/lib/funnel.ts and never read
-- from the client. RLS on with no policies denies every non-service caller,
-- matching the posture already used for `leads`.
alter table public.funnel_events enable row level security;

-- 5. `children` UPDATE policy. This exists in the live database (the
--    onboarding modal's updateChildGoals demonstrably works) but is absent
--    from schema.sql. Declared idempotently so the two agree. Postgres has no
--    `create policy if not exists`, hence drop-then-create.
drop policy if exists "Users can update their own children" on public.children;
create policy "Users can update their own children"
  on public.children for update
  using (auth.uid() = parent_id)
  with check (auth.uid() = parent_id);
