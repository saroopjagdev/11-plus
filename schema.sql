-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- REFERRAL PARTNERS: tutor/business outreach partners, distinct from the
-- user-to-user referral program on PROFILES below (referral_code/referred_by).
-- Declared before PROFILES since profiles.partner_referral_code references
-- it by column-level FK. See scripts/tutor-partner-referrals-migration.sql
-- for full rationale.
create table public.referral_partners (
  code text primary key,
  name text not null,
  email text,
  region text,
  discount_pct integer not null default 15,
  commission_pct integer not null default 20,
  commission_months integer not null default 3,
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PROFILES: Links to Supabase Auth users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role text check (role in ('parent', 'student')) default 'parent',
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text check (subscription_status in ('free', 'trialing', 'active', 'past_due', 'canceled')) default 'free',
  subscription_trial_end timestamp with time zone,
  subscription_current_period_end timestamp with time zone,
  subscription_cancel_at_period_end boolean default false,
  subscription_last_synced_at timestamp with time zone,
  -- Email preferences and per-cadence throttles. See
  -- scripts/funnel-and-email-migration.sql.
  email_consent_weekly boolean default true,
  email_consent_nudges boolean default true,
  last_weekly_report_at timestamp with time zone,
  last_inactivity_nudge_at timestamp with time zone,
  last_report_sent_at timestamp with time zone,
  last_setup_nudge_at timestamp with time zone,
  -- First-touch marketing attribution. See
  -- scripts/utm-attribution-migration.sql.
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  landing_referrer text,
  -- Set when a signup came through a tutor/business partner's referral
  -- link. See referral_partners below. Mutually exclusive with the
  -- pre-existing referred_by (profile uuid) in practice, though nothing in
  -- the schema itself enforces that.
  partner_referral_code text references public.referral_partners(code),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- NOTE: the live `profiles` table also carries referral and entitlement
-- columns (referral_code, referred_by, referral_count, referral_rewarded,
-- pending_referral_credits, lifetime_access) that were added out-of-band and
-- are still not declared here. They are untouched by this work; their exact
-- types/defaults need to be dumped from production before being committed
-- rather than guessed at.

-- CHILDREN: Students linked to a parent
create table public.children (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  age integer,
  target_schools jsonb default '[]',
  exam_date date,
  has_completed_onboarding boolean default false,
  current_streak integer default 0,
  total_points integer default 0,
  xp integer default 0,
  level integer default 1,
  avatar_url text,
  target_exams text[] default '{}',
  focus_areas text[] default '{}',
  last_practice_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PASSAGES: Long texts for English Comprehension
create table public.passages (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  author text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- QUESTIONS: Practice content
create table public.questions (
  id uuid primary key default uuid_generate_v4(),
  subject text not null check (subject in ('Maths', 'English', 'Verbal Reasoning', 'Non-Verbal Reasoning')),
  topic text not null,
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')),
  type text check (type in ('mcq', 'written')) default 'mcq',
  question_text text not null,
  options jsonb, -- Array of strings (optional for written questions)
  correct_answer text not null,
  passage_id uuid references public.passages(id) on delete set null,
  image_url text, -- For NVR questions
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- EXPLANATIONS: Cached AI feedback
create table public.explanations (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references public.questions(id) on delete cascade not null,
  explanation_text text not null,
  helpful_count integer default 0,
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SESSIONS: Tracks a group of questions (e.g., 10-question practice)
create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references public.children(id) on delete cascade not null,
  type text check (type in ('practice', 'diagnostic', 'mock')) default 'practice',
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  score integer default 0
);

-- QUESTION ATTEMPTS: Log of every question answered
create table public.question_attempts (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.sessions(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  selected_answer text,
  is_correct boolean,
  time_taken_seconds integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TOPIC MASTERY: Aggregated accuracy per topic
create table public.topic_mastery (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references public.children(id) on delete cascade not null,
  subject text not null,
  topic text not null,
  accuracy decimal default 0,
  questions_answered integer default 0,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (child_id, topic)
);

-- DIAGNOSTIC RESULTS: Baseline performance
create table public.diagnostic_results (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references public.children(id) on delete cascade not null,
  score integer not null,
  topic_breakdown jsonb not null, -- Stores accuracy per topic as JSON
  ai_summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- LEADS: Captured diagnostic and marketing leads before signup
create table public.leads (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  source text not null default 'diagnostic',
  status text not null default 'captured' check (status in ('captured', 'signup_started', 'account_created', 'claimed', 'abandoned')),
  diagnostic_score integer,
  diagnostic_breakdown jsonb,
  diagnostic_ai_summary text,
  diagnostic_completed_at timestamp with time zone,
  claimed_by_user_id uuid references public.profiles(id) on delete set null,
  referral_code text,
  landing_path text,
  -- First-touch marketing attribution. See
  -- scripts/utm-attribution-migration.sql.
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  landing_referrer text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index leads_email_idx on public.leads(email);
create index leads_status_idx on public.leads(status);
create index leads_utm_source_idx on public.leads(utm_source);
create index profiles_utm_source_idx on public.profiles(utm_source);

-- PARTNER COMMISSIONS: see referral_partners, declared earlier (before
-- PROFILES) since profiles.partner_referral_code references it.
create table public.partner_commissions (
  id uuid primary key default uuid_generate_v4(),
  partner_code text not null references public.referral_partners(code),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  stripe_invoice_id text not null unique,
  invoice_sequence integer not null,
  amount_paid_cents integer not null,
  commission_cents integer not null,
  currency text not null default 'gbp',
  period_start date not null,
  paid_out boolean not null default false,
  paid_out_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index partner_commissions_partner_code_idx on public.partner_commissions(partner_code);
create index partner_commissions_period_start_idx on public.partner_commissions(period_start);
create index partner_commissions_profile_id_idx on public.partner_commissions(profile_id);

-- FUNNEL EVENTS: first-party analytics for the signup -> trial journey.
-- Narrow/long so new event names never need a migration. Written only by
-- src/lib/funnel.ts with the service-role client; never read from the client.
-- Duplicates are expected -- dedupe at read time with
-- `select distinct on (user_id, event_name) ...`.
create table public.funnel_events (
  id uuid primary key default uuid_generate_v4(),
  event_name text not null,
  user_id uuid references auth.users(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  properties jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index funnel_events_event_name_idx on public.funnel_events(event_name);
create index funnel_events_user_id_idx on public.funnel_events(user_id);
create index funnel_events_created_at_idx on public.funnel_events(created_at);

-- WEEKLY REPORTS: AI-generated summaries for parents
create table public.weekly_reports (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references public.children(id) on delete cascade not null,
  week_start_date date not null,
  ai_summary text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (child_id, week_start_date)
);

-- ROW LEVEL SECURITY (RLS)

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.questions enable row level security;
alter table public.passages enable row level security;
alter table public.explanations enable row level security;
alter table public.sessions enable row level security;
alter table public.question_attempts enable row level security;
alter table public.topic_mastery enable row level security;
alter table public.diagnostic_results enable row level security;
alter table public.weekly_reports enable row level security;
alter table public.leads enable row level security;
-- No policies below: service-role writes only.
alter table public.funnel_events enable row level security;
alter table public.referral_partners enable row level security;
alter table public.partner_commissions enable row level security;

-- Policies for Profiles
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Policies for Children
create policy "Parents can view their children" on public.children
  for select using (auth.uid() = parent_id);

create policy "Parents can insert children" on public.children
  for insert with check (auth.uid() = parent_id);

-- Policies for Questions (Public Select)
create policy "Anyone can view questions" on public.questions
  for select using (true);

create policy "Anyone can view passages" on public.passages
  for select using (true);

-- Policies for Explanations (Public Select)
create policy "Anyone can view explanations" on public.explanations
  for select using (true);

-- Policies for Sessions
create policy "Parents can view their children's sessions" on public.sessions
  for select using (auth.uid() in (select parent_id from public.children where id = child_id));

create policy "Insert sessions for own children" on public.sessions
  for insert with check (auth.uid() in (select parent_id from public.children where id = child_id));

-- Policies for Attempts
create policy "Parents/Students can view own attempts" on public.question_attempts
  for select using (auth.uid() in (select parent_id from public.children where id = child_id));

create policy "Insert attempts for own children" on public.question_attempts
  for insert with check (auth.uid() in (select parent_id from public.children where id = child_id));

-- Policies for Topic Mastery
create policy "View own topic mastery" on public.topic_mastery
  for select using (auth.uid() in (select parent_id from public.children where id = child_id));

create policy "Insert topic mastery for own children" on public.topic_mastery
  for insert with check (auth.uid() in (select parent_id from public.children where id = child_id));

create policy "Update topic mastery for own children" on public.topic_mastery
  for update using (auth.uid() in (select parent_id from public.children where id = child_id));

-- Policies for Diagnostic Results
create policy "View own diagnostic results" on public.diagnostic_results
  for select using (auth.uid() in (select parent_id from public.children where id = child_id));

create policy "Insert diagnostic results for own children" on public.diagnostic_results
  for insert with check (auth.uid() in (select parent_id from public.children where id = child_id));

-- Policies for Weekly Reports
create policy "Parents can view their children's weekly reports" on public.weekly_reports
  for select using (auth.uid() in (select parent_id from public.children where id = child_id));

create policy "Insert weekly reports for own children" on public.weekly_reports
  for insert with check (auth.uid() in (select parent_id from public.children where id = child_id));

-- FUNCTIONS & TRIGGERS

-- Automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'parent');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
