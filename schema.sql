-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES: Links to Supabase Auth users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role text check (role in ('parent', 'student')) default 'parent',
  stripe_customer_id text,
  subscription_status text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CHILDREN: Students linked to a parent
create table public.children (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  age integer,
  current_streak integer default 0,
  total_points integer default 0,
  xp integer default 0,
  level integer default 1,
  avatar_url text,
  last_practice_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- QUESTIONS: Practice content
create table public.questions (
  id uuid primary key default uuid_generate_v4(),
  subject text not null check (subject in ('Maths', 'English', 'Verbal Reasoning')),
  topic text not null,
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')),
  question_text text not null,
  options jsonb not null, -- Array of strings
  correct_answer text not null,
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
  type text check (type in ('practice', 'diagnostic')) default 'practice',
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

-- ROW LEVEL SECURITY (RLS)

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.questions enable row level security;
alter table public.explanations enable row level security;
alter table public.sessions enable row level security;
alter table public.question_attempts enable row level security;
alter table public.topic_mastery enable row level security;
alter table public.diagnostic_results enable row level security;

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
