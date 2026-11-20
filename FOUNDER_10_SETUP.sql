-- FTRIVA Founding 10: additive setup only. Does not modify or delete existing tables.
create table if not exists public.ftriva_founder_claims (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  phone text,
  package_id text not null check (package_id in ('start','progress','performance','digital')),
  status text not null default 'claimed' check (status in ('claimed','assessment_submitted','cancelled')),
  claimed_at timestamptz not null default now(),
  assessment_submitted_at timestamptz
);
create unique index if not exists ftriva_founder_claims_email_unique on public.ftriva_founder_claims (lower(email));
alter table public.ftriva_founder_claims enable row level security;
revoke all on public.ftriva_founder_claims from anon, authenticated;
grant select, insert, update on public.ftriva_founder_claims to service_role;
create or replace function public.ftriva_claim_founder(p_email text,p_full_name text,p_phone text,p_package_id text)
returns table(claim_id uuid,remaining integer)
language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_count integer;
begin
  if p_package_id not in ('start','progress','performance','digital') then raise exception 'INVALID_PACKAGE'; end if;
  perform pg_advisory_xact_lock(hashtext('ftriva_founder_10_global_claim_lock'));
  if exists(select 1 from public.ftriva_founder_claims where lower(email)=lower(trim(p_email))) then raise exception 'ALREADY_CLAIMED'; end if;
  select count(*) into v_count from public.ftriva_founder_claims where status in ('claimed','assessment_submitted');
  if v_count>=10 then raise exception 'FOUNDERS_FULL'; end if;
  insert into public.ftriva_founder_claims(email,full_name,phone,package_id)
  values(lower(trim(p_email)),trim(p_full_name),nullif(trim(p_phone),''),p_package_id) returning id into v_id;
  return query select v_id, greatest(0,9-v_count);
end; $$;
revoke all on function public.ftriva_claim_founder(text,text,text,text) from public,anon,authenticated;
grant execute on function public.ftriva_claim_founder(text,text,text,text) to service_role;
