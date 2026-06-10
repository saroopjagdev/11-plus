begin;

create table if not exists public.issue_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'reviewed', 'resolved')),
  category text not null,
  message text not null,
  reporter_email text,
  user_id uuid,
  child_id uuid references public.children(id) on delete set null,
  session_id uuid references public.sessions(id) on delete set null,
  question_id uuid references public.questions(id) on delete set null,
  page_path text,
  context_json jsonb not null default '{}'::jsonb
);

create index if not exists issue_reports_created_at_idx
  on public.issue_reports (created_at desc);

create index if not exists issue_reports_status_idx
  on public.issue_reports (status);

create index if not exists issue_reports_user_id_idx
  on public.issue_reports (user_id);

create index if not exists issue_reports_child_id_idx
  on public.issue_reports (child_id);

alter table public.issue_reports enable row level security;

drop policy if exists "Authenticated users can insert their own issue reports" on public.issue_reports;
create policy "Authenticated users can insert their own issue reports"
  on public.issue_reports
  for insert
  to authenticated
  with check (user_id = auth.uid());

commit;
