-- Adds a parallel referral-partner system for tutor/business outreach,
-- distinct from the existing user-to-user referral program.
--
-- Why separate rather than reusing profiles.referral_code/referred_by: the
-- terms are genuinely different in every dimension. The existing program is
-- parent-to-parent (50% off referee's first month, referrer gets a free
-- month credited to their own Ace 11+ subscription via a Stripe balance
-- transaction — see the checkout.session.completed handler in
-- src/app/api/webhooks/stripe/route.ts). Tutor partners are not Ace 11+
-- users at all — they have no profile, no subscription to credit against —
-- and the reward is real cash commission (a % of what their referred
-- students actually pay, for a limited number of months), not app credit.
-- Bolting that onto the existing referred_by/pending_referral_credits
-- columns would conflate two incompatible reward mechanisms.

-- One row per outreach recipient who gets a code, whether or not they ever
-- sign anyone up. `discount_pct`/`commission_pct`/`commission_months` are
-- stored per-partner (not hardcoded) so a specific partner's deal can be
-- adjusted later without a schema change, even though every partner
-- currently gets the same defaults (15% off / 20% commission / 3 months).
create table if not exists public.referral_partners (
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

-- Which partner code (if any) a signup came through. Separate column from
-- the existing `referred_by` (a profile uuid) since a partner is never a
-- profile — this is a text FK into referral_partners instead. A signup can
-- match at most one of referred_by / partner_referral_code, never both (the
-- lookup in app/actions/auth.ts checks profiles.referral_code first, then
-- referral_partners.code, for a given ?ref= value).
alter table public.profiles
  add column if not exists partner_referral_code text references public.referral_partners(code);

create index if not exists profiles_partner_referral_code_idx
  on public.profiles(partner_referral_code);

-- Commission ledger — one row per paid invoice that earns a partner
-- commission. Written by the invoice.payment_succeeded handler in
-- src/app/api/webhooks/stripe/route.ts. `stripe_invoice_id` is unique so a
-- redelivered webhook (Stripe does this) can never double-count a
-- commission — the insert is attempted unconditionally and a unique-
-- violation is caught and treated as "already recorded", same idempotency
-- shape as everything else in this webhook.
create table if not exists public.partner_commissions (
  id uuid primary key default uuid_generate_v4(),
  partner_code text not null references public.referral_partners(code),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  stripe_invoice_id text not null unique,
  invoice_sequence integer not null, -- 1st, 2nd, 3rd... paid invoice for this referred customer
  amount_paid_cents integer not null,
  commission_cents integer not null,
  currency text not null default 'gbp',
  period_start date not null, -- first of the month the invoice was paid, for monthly grouping
  paid_out boolean not null default false,
  paid_out_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists partner_commissions_partner_code_idx
  on public.partner_commissions(partner_code);
create index if not exists partner_commissions_period_start_idx
  on public.partner_commissions(period_start);
create index if not exists partner_commissions_profile_id_idx
  on public.partner_commissions(profile_id);

-- Service-role only on both new tables — same posture as `leads` and
-- `funnel_events`. Partner names/emails and commission amounts are
-- internal business data, never read from the client.
alter table public.referral_partners enable row level security;
alter table public.partner_commissions enable row level security;
