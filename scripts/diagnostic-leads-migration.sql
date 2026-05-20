create extension if not exists "uuid-ossp";

create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  source text not null default 'diagnostic',
  status text not null default 'captured',
  diagnostic_score integer,
  diagnostic_breakdown jsonb,
  diagnostic_ai_summary text,
  diagnostic_completed_at timestamp with time zone,
  claimed_by_user_id uuid references public.profiles(id) on delete set null,
  referral_code text,
  landing_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'leads_status_check'
  ) then
    alter table public.leads
      add constraint leads_status_check
      check (status in ('captured', 'signup_started', 'account_created', 'claimed', 'abandoned'));
  end if;
end $$;

create index if not exists leads_email_idx on public.leads(email);
create index if not exists leads_status_idx on public.leads(status);

alter table public.leads enable row level security;
