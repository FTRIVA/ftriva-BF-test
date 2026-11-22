create table if not exists public.client_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  payment_reference text not null unique,
  customer_email text not null,
  package_code text not null check (package_code in ('START','PROGRESS','PERFORMANCE')),
  assessment_data jsonb not null,
  status text not null default 'submitted'
    check (status in ('submitted','under_review','reviewing','reviewed','programme_assigned')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_assessments_user_id_idx on public.client_assessments(user_id);
create index if not exists client_assessments_status_idx on public.client_assessments(status);
create index if not exists client_assessments_email_idx on public.client_assessments(lower(customer_email));

alter table public.client_assessments enable row level security;

create policy "FTRIVA admins can manage client assessments"
on public.client_assessments
for all
to authenticated
using (private.is_ftriva_admin())
with check (private.is_ftriva_admin());

grant select, update on public.client_assessments to authenticated;

create or replace function public.claim_my_ftriva_entitlements()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_purchases integer := 0;
  v_memberships integer := 0;
  v_assessments integer := 0;
begin
  if v_user_id is null or v_email = '' then
    raise exception 'A signed-in account with a verified email is required';
  end if;

  if not exists (
    select 1
    from auth.users u
    where u.id = v_user_id
      and u.email_confirmed_at is not null
      and lower(u.email) = v_email
  ) then
    raise exception 'Confirm your email address before claiming FTRIVA access';
  end if;

  update public.purchases
  set user_id = v_user_id,
      updated_at = now()
  where user_id is null
    and lower(customer_email) = v_email
    and status = 'verified';
  get diagnostics v_purchases = row_count;

  update public.memberships
  set user_id = v_user_id,
      updated_at = now()
  where user_id is null
    and lower(customer_email) = v_email
    and status in ('active','past_due','pending');
  get diagnostics v_memberships = row_count;

  update public.client_assessments
  set user_id = v_user_id,
      updated_at = now()
  where user_id is null
    and lower(customer_email) = v_email;
  get diagnostics v_assessments = row_count;

  return jsonb_build_object(
    'purchases_claimed', v_purchases,
    'memberships_claimed', v_memberships,
    'assessments_claimed', v_assessments
  );
end;
$$;

revoke all on function public.claim_my_ftriva_entitlements() from public, anon;
grant execute on function public.claim_my_ftriva_entitlements() to authenticated;
