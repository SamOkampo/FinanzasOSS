-- FinanzasOSS Quick personal MVP, Supabase/PostgreSQL TARGET MIGRATION.
-- Do not apply to production without separate authorization, backups and staging tests.
-- This adds manually-labelled personal accounts only; it cannot verify bank ownership,
-- access bank APIs, debit accounts, transfer money, or trade assets.
-- Applied through an authorized migration runner, never browser SQL.

begin;

create table if not exists public.quick_manual_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null check (length(btrim(tenant_id)) between 1 and 128 and tenant_id = btrim(tenant_id)),
  owner_user_id uuid not null default auth.uid(),
  label text not null check (length(btrim(label)) between 1 and 100),
  currency text not null check (currency in ('COP', 'USD')),
  account_kind text not null check (account_kind in ('cash', 'bank_manual', 'credit_manual', 'wallet_manual')),
  unverified_institution_label text check (unverified_institution_label is null or length(btrim(unverified_institution_label)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (id, tenant_id, owner_user_id, currency)
);

create table if not exists public.quick_manual_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null check (length(btrim(tenant_id)) between 1 and 128 and tenant_id = btrim(tenant_id)),
  owner_user_id uuid not null,
  account_id uuid not null,
  client_entry_id text not null check (client_entry_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$'),
  amount_minor bigint not null check (amount_minor between 1 and 1000000000000),
  currency text not null check (currency in ('COP', 'USD')),
  payment_method text not null check (payment_method in (
    'cash', 'debit_card', 'credit_card', 'bank_transfer', 'digital_wallet', 'other'
  )),
  kind text not null check (kind in ('purchase', 'transfer', 'investment_transfer')),
  occurred_at timestamptz not null check (
    occurred_at <> 'infinity'::timestamptz and occurred_at <> '-infinity'::timestamptz
  ),
  merchant text check (merchant is null or length(btrim(merchant)) between 1 and 120),
  bank_label text check (bank_label is null or length(btrim(bank_label)) between 1 and 80),
  confirmed_at timestamptz not null default now(),
  source text not null default 'manual' check (source = 'manual'),
  direction text not null default 'debit' check (direction = 'debit'),
  foreign key (account_id, tenant_id, owner_user_id, currency)
    references public.quick_manual_accounts (id, tenant_id, owner_user_id, currency)
    on update restrict on delete restrict,
  unique (owner_user_id, tenant_id, client_entry_id)
);

create index if not exists quick_manual_entries_owner_timeline
  on public.quick_manual_entries (owner_user_id, tenant_id, occurred_at desc, id desc);

-- Never grant service credentials to the browser. No UPDATE/DELETE privileges:
-- editing, reversals and data deletion require a separate reviewed implementation.
alter table public.quick_manual_accounts enable row level security;
alter table public.quick_manual_accounts force row level security;
alter table public.quick_manual_entries enable row level security;
alter table public.quick_manual_entries force row level security;

drop policy if exists quick_accounts_select_own on public.quick_manual_accounts;
create policy quick_accounts_select_own on public.quick_manual_accounts
  for select to authenticated using (owner_user_id = (select auth.uid()));

drop policy if exists quick_accounts_insert_own on public.quick_manual_accounts;
create policy quick_accounts_insert_own on public.quick_manual_accounts
  for insert to authenticated with check (owner_user_id = (select auth.uid()));

drop policy if exists quick_entries_select_own on public.quick_manual_entries;
create policy quick_entries_select_own on public.quick_manual_entries
  for select to authenticated using (owner_user_id = (select auth.uid()));

drop policy if exists quick_entries_insert_own on public.quick_manual_entries;
create policy quick_entries_insert_own on public.quick_manual_entries
  for insert to authenticated with check (owner_user_id = (select auth.uid()));

revoke all on public.quick_manual_accounts from public, anon, authenticated;
revoke all on public.quick_manual_entries from public, anon, authenticated;
grant select, insert on public.quick_manual_accounts to authenticated;
grant select on public.quick_manual_entries to authenticated;

-- Atomic confirmation + idempotent retry. Authentication is derived from
-- Supabase's validated request JWT, never from user-supplied owner/actor IDs.
-- SECURITY DEFINER is intentionally narrow (fixed SQL, empty search_path),
-- and the routine verifies the caller's UID and account ownership explicitly.
-- No direct INSERT grant to authenticated: writes must go through this RPC.
-- The migration/function owner must remain a trusted admin role only.

create or replace function public.quick_confirm_manual_entry(
  p_tenant_id text,
  p_account_id uuid,
  p_client_entry_id text,
  p_amount_minor bigint,
  p_currency text,
  p_payment_method text,
  p_kind text,
  p_occurred_at timestamptz,
  p_merchant text default null,
  p_bank_label text default null,
  p_confirmed boolean default false
)
returns table (entry_id uuid, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_account uuid;
  v_entry uuid;
begin
  if v_owner is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_confirmed is distinct from true then
    raise exception 'Explicit confirmation required' using errcode = '22023';
  end if;
  if p_tenant_id is null or length(btrim(p_tenant_id)) not between 1 and 128
     or p_tenant_id <> btrim(p_tenant_id)
     or p_client_entry_id !~ '^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$'
     or p_client_entry_id is null
     or p_amount_minor is null or p_amount_minor not between 1 and 1000000000000
     or p_currency not in ('COP', 'USD') or p_currency is null
     or p_payment_method not in (
       'cash', 'debit_card', 'credit_card', 'bank_transfer', 'digital_wallet', 'other'
     ) or p_payment_method is null
     or p_kind not in ('purchase', 'transfer', 'investment_transfer') or p_kind is null
     or p_occurred_at is null or p_occurred_at in (
       'infinity'::timestamptz, '-infinity'::timestamptz
     )
     or (p_merchant is not null and length(btrim(p_merchant)) not between 1 and 120)
     or (p_bank_label is not null and length(btrim(p_bank_label)) not between 1 and 80)
  then
    raise exception 'Invalid quick entry' using errcode = '22023';
  end if;

  -- Existence check is scoped to caller + tenant + matching currency.
  select a.id into v_account
  from public.quick_manual_accounts as a
  where a.id = p_account_id
    and a.owner_user_id = v_owner
    and a.tenant_id = p_tenant_id
    and a.currency = p_currency;
  if v_account is null then
    raise exception 'Manual account not owned or incompatible' using errcode = '42501';
  end if;

  insert into public.quick_manual_entries (
    tenant_id, owner_user_id, account_id, client_entry_id, amount_minor,
    currency, payment_method, kind, occurred_at, merchant, bank_label
  )
  values (
    p_tenant_id, v_owner, v_account, p_client_entry_id, p_amount_minor,
    p_currency, p_payment_method, p_kind, p_occurred_at, p_merchant, p_bank_label
  )
  on conflict (owner_user_id, tenant_id, client_entry_id) do nothing
  returning id into v_entry;

  if v_entry is not null then
    return query select v_entry, false;
    return;
  end if;

  -- An existing idempotency key is valid only when its *whole payload*
  -- matches. Never overwrite a prior expense on conflict.
  select e.id into v_entry
  from public.quick_manual_entries as e
  where e.owner_user_id = v_owner
    and e.tenant_id = p_tenant_id
    and e.client_entry_id = p_client_entry_id
    and e.account_id = p_account_id
    and e.amount_minor = p_amount_minor
    and e.currency = p_currency
    and e.payment_method = p_payment_method
    and e.kind = p_kind
    and e.occurred_at = p_occurred_at
    and e.merchant is not distinct from p_merchant
    and e.bank_label is not distinct from p_bank_label;

  if v_entry is null then
    raise exception 'Idempotency key reused with different content' using errcode = '23505';
  end if;
  return query select v_entry, true;
end;
$$;

revoke all on function public.quick_confirm_manual_entry(
  text, uuid, text, bigint, text, text, text, timestamptz, text, text, boolean
) from public, anon;
grant execute on function public.quick_confirm_manual_entry(
  text, uuid, text, bigint, text, text, text, timestamptz, text, text, boolean
) to authenticated;

commit;
