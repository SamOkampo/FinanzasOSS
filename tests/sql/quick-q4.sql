\set ON_ERROR_STOP on
-- Disposable PostgreSQL fixture; synthetic users only, no real banking data.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create function auth.uid() returns uuid
  language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to authenticated, anon;
grant usage on schema public to authenticated, anon;

\ir ../../packages/database/migrations/0001_quick_personal.sql

set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

insert into public.quick_manual_accounts (tenant_id, label, account_kind, currency)
values ('personal-a', 'Efectivo ficticio', 'cash', 'COP')
returning id as account_id \gset

-- The first confirmed manual item must be inserted exactly once.
select entry_id::text as first_entry, replayed::text as first_replayed
from public.quick_confirm_manual_entry(
  'personal-a', :'account_id'::uuid, 'quick-entry-0000000001',
  2500025, 'COP', 'debit_card', 'purchase',
  '2026-10-15T11:30:00Z'::timestamptz, 'Almuerzo', null, true
) \gset

select 1 / case when :'first_replayed' = 'false' then 1 else 0 end;
select 1 / case when (select count(*) from public.quick_manual_entries) = 1 then 1 else 0 end;

-- Retrying identical data must return the same row, not a second charge.
select entry_id::text as retry_entry, replayed::text as retry_replayed
from public.quick_confirm_manual_entry(
  'personal-a', :'account_id'::uuid, 'quick-entry-0000000001',
  2500025, 'COP', 'debit_card', 'purchase',
  '2026-10-15T11:30:00Z'::timestamptz, 'Almuerzo', null, true
) \gset
select 1 / case when :'first_entry' = :'retry_entry' and :'retry_replayed' = 'true' then 1 else 0 end;
select 1 / case when (select count(*) from public.quick_manual_entries) = 1 then 1 else 0 end;

-- Authenticated clients must NOT be able to insert ledger rows directly.
do $$
begin
  begin
    insert into public.quick_manual_entries (
      tenant_id, owner_user_id, account_id, client_entry_id, amount_minor,
      currency, payment_method, kind, occurred_at
    ) values (
      'personal-a', auth.uid(), (select id from public.quick_manual_accounts limit 1),
      'direct-insert-000001', 100, 'COP', 'cash', 'purchase', now()
    );
    raise exception 'direct INSERT unexpectedly permitted';
  exception when insufficient_privilege then null;
  end;
end $$;

-- A changed retry must fail, even with the same idempotency key.
do $$
declare
  v_account uuid := (select id from public.quick_manual_accounts limit 1);
begin
  begin
    perform public.quick_confirm_manual_entry(
      'personal-a', v_account, 'quick-entry-0000000001',
      999, 'COP', 'debit_card', 'purchase',
      '2026-10-15T11:30:00Z'::timestamptz, 'Almuerzo', null, true
    );
    raise exception 'modified idempotency replay unexpectedly permitted';
  exception when unique_violation then null;
  end;
end $$;

-- No implicit write: confirmation must be explicitly true.
do $$
declare
  v_account uuid := (select id from public.quick_manual_accounts limit 1);
begin
  begin
    perform public.quick_confirm_manual_entry(
      'personal-a', v_account, 'quick-entry-0000000002',
      100, 'COP', 'cash', 'purchase',
      '2026-10-15T11:30:00Z'::timestamptz, null, null, false
    );
    raise exception 'unconfirmed entry unexpectedly permitted';
  exception when invalid_parameter_value then null;
  end;
end $$;

-- Currency must match the user's actual manually labelled account.
do $$
declare
  v_account uuid := (select id from public.quick_manual_accounts limit 1);
begin
  begin
    perform public.quick_confirm_manual_entry(
      'personal-a', v_account, 'quick-entry-0000000002',
      100, 'USD', 'cash', 'purchase',
      '2026-10-15T11:30:00Z'::timestamptz, null, null, true
    );
    raise exception 'wrong currency unexpectedly permitted';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Psql variables do not interpolate inside PL/pgSQL dollar-quoted bodies.
select set_config('test.account_id', :'account_id', false);
-- Different user, same tenant label: no access to first user's account.
set request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
select 1 / case when (select count(*) from public.quick_manual_accounts) = 0 then 1 else 0 end;
select 1 / case when (select count(*) from public.quick_manual_entries) = 0 then 1 else 0 end;

do $$
declare
  v_foreign uuid := current_setting('test.account_id')::uuid;
begin
  begin
    perform public.quick_confirm_manual_entry(
      'personal-a', v_foreign, 'quick-entry-0000000002',
      100, 'COP', 'cash', 'purchase',
      '2026-10-15T11:30:00Z'::timestamptz, null, null, true
    );
    raise exception 'cross-user account unexpectedly permitted';
  exception when insufficient_privilege then null;
  end;
end $$;

-- A second user can create their own separate manual account and ledger.
insert into public.quick_manual_accounts (tenant_id, label, account_kind, currency)
values ('personal-a', 'Efectivo otro usuario', 'cash', 'COP')
returning id as account_two \gset

select replayed::text as second_replayed from public.quick_confirm_manual_entry(
  'personal-a', :'account_two'::uuid, 'quick-entry-0000000001',
  4500, 'COP', 'cash', 'investment_transfer',
  '2026-10-15T11:30:00Z'::timestamptz, null, null, true
) \gset
select 1 / case when :'second_replayed' = 'false' then 1 else 0 end;
select 1 / case when (select count(*) from public.quick_manual_entries) = 1 then 1 else 0 end;

-- Anonymous access must fail.
reset role;
set role anon;
set request.jwt.claim.sub = '';
do $$
begin
  begin
    perform public.quick_confirm_manual_entry(
      'personal-a', '00000000-0000-4000-8000-000000000000'::uuid,
      'quick-entry-0000000003', 100, 'COP', 'cash', 'purchase',
      now(), null, null, true
    );
    raise exception 'anonymous RPC call unexpectedly permitted';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
select 'Quick Q4 PostgreSQL RLS, RPC and idempotency integration passed' as success;
