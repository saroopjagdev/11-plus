alter table public.profiles
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_trial_end timestamp with time zone,
  add column if not exists subscription_current_period_end timestamp with time zone,
  add column if not exists subscription_cancel_at_period_end boolean default false,
  add column if not exists subscription_last_synced_at timestamp with time zone;

update public.profiles
set subscription_status = 'active'
where subscription_status = 'pro';

alter table public.profiles
  drop constraint if exists profiles_subscription_status_check;

alter table public.profiles
  add constraint profiles_subscription_status_check
  check (subscription_status in ('free', 'trialing', 'active', 'past_due', 'canceled'));
