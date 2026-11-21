-- FTRIVA Founding 10 setup.
-- Uses the exact table and RPC names called by src/index.js.
-- Requires the existing public.ftriva_assessments table.

create extension if not exists pgcrypto;

create table if not exists public.ftriva_founding10_claims (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  phone text,
  package_id text not null check (package_id in ('START','PROGRESS','PERFORMANCE','DIGITAL')),
  claim_token_hash text not null unique,
  status text not null default 'claimed'
    check (status in ('claimed','assessment_submitted','cancelled')),
  assessment_data jsonb,
  claimed_at timestamptz not null default now(),
  submitted_at timestamptz
);

create unique index if not exists ftriva_founding10_claims_email_unique
  on public.ftriva_founding10_claims (lower(email));

alter table public.ftriva_founding10_claims enable row level security;
revoke all on public.ftriva_founding10_claims from anon, authenticated;
grant select, insert, update on public.ftriva_founding10_claims to service_role;

-- Link each free claim to the same assessment workflow used for paid clients.
alter table public.ftriva_assessments
  add column if not exists founding10_claim_id uuid
  references public.ftriva_founding10_claims(id);

create unique index if not exists ftriva_assessments_founding10_claim_unique
  on public.ftriva_assessments (founding10_claim_id)
  where founding10_claim_id is not null;

create or replace function public.claim_ftriva_founding10(
  p_full_name text,
  p_email text,
  p_phone text,
  p_package_id text,
  p_claim_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_id uuid;
begin
  if upper(p_package_id) not in ('START','PROGRESS','PERFORMANCE','DIGITAL') then
    return jsonb_build_object('claimed', false, 'reason', 'invalid_package');
  end if;

  perform pg_advisory_xact_lock(hashtext('ftriva_founding10_global_claim_lock'));

  if exists (
    select 1 from public.ftriva_founding10_claims
    where lower(email) = lower(trim(p_email))
  ) then
    return jsonb_build_object('claimed', false, 'reason', 'duplicate');
  end if;

  select count(*) into v_count
  from public.ftriva_founding10_claims
  where status in ('claimed','assessment_submitted');

  if v_count >= 10 then
    return jsonb_build_object('claimed', false, 'reason', 'full');
  end if;

  insert into public.ftriva_founding10_claims
    (email, full_name, phone, package_id, claim_token_hash)
  values
    (lower(trim(p_email)), trim(p_full_name), nullif(trim(p_phone), ''),
     upper(p_package_id), p_claim_token_hash)
  returning id into v_id;

  return jsonb_build_object('claimed', true, 'claimed_count', v_count + 1, 'claim_id', v_id);
end;
$$;

create or replace function public.submit_ftriva_founding10_assessment(
  p_claim_token_hash text,
  p_assessment jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim public.ftriva_founding10_claims%rowtype;
begin
  update public.ftriva_founding10_claims
  set assessment_data = p_assessment,
      status = 'assessment_submitted',
      submitted_at = now()
  where claim_token_hash = p_claim_token_hash
    and status = 'claimed'
  returning * into v_claim;

  if not found then
    return jsonb_build_object('submitted', false);
  end if;

  insert into public.ftriva_assessments (
    founding10_claim_id,
    package_type,
    customer_email,
    assessment_data,
    requested_start_date,
    status,
    submitted_at
  ) values (
    v_claim.id,
    v_claim.package_id,
    v_claim.email,
    p_assessment,
    nullif(p_assessment->>'startDate', ''),
    'assessment_submitted',
    now()
  );

  return jsonb_build_object('submitted', true);
end;
$$;

revoke all on function public.claim_ftriva_founding10(text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.submit_ftriva_founding10_assessment(text,jsonb) from public, anon, authenticated;
grant execute on function public.claim_ftriva_founding10(text,text,text,text,text) to service_role;
grant execute on function public.submit_ftriva_founding10_assessment(text,jsonb) to service_role;
