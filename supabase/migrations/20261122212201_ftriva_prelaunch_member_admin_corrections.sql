-- FTRIVA pre-launch member/admin corrections.
-- Applied to the test member-app Supabase project only.

-- Correct the asset entitlement helper to use the private admin helper.
create or replace function private.has_programme_access(p_asset_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    private.is_ftriva_admin()
    or exists (
      select 1
      from public.programme_assets a
      where a.id = p_asset_id
        and a.active
        and (
          (a.package_code is not null and exists (
            select 1 from public.purchases p
            where p.user_id = (select auth.uid())
              and p.package_code = a.package_code
              and p.status = 'verified'
          ))
          or
          (a.required_membership_tier is not null and exists (
            select 1 from public.memberships m
            where m.user_id = (select auth.uid())
              and m.status = 'active'
              and case m.tier
                when 'ESSENTIAL' then 1
                when 'PLUS' then 2
                when 'ELITE' then 3
              end >= case a.required_membership_tier
                when 'ESSENTIAL' then 1
                when 'PLUS' then 2
                when 'ELITE' then 3
              end
              and (m.current_period_end is null or m.current_period_end > now())
          ))
        )
    );
$function$;

alter table public.client_assessments add column if not exists admin_notes text;
alter table public.client_assessments drop constraint if exists client_assessments_status_check;
update public.client_assessments set status='under_review' where status='reviewing';
alter table public.client_assessments add constraint client_assessments_status_check
  check (status in ('submitted','under_review','awaiting_information','reviewed','programme_assigned'));

alter table public.exercise_feedback add column if not exists status text not null default 'new';
update public.exercise_feedback
set status = case when nullif(trim(coalesce(coach_response,'')),'') is not null then 'responded' else 'new' end;
alter table public.exercise_feedback drop constraint if exists exercise_feedback_status_check;
alter table public.exercise_feedback add constraint exercise_feedback_status_check
  check (status in ('new','responded','resolved'));

create table if not exists public.member_message_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  status text not null default 'open' check (status in ('open','in_progress','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.member_messages
  add column if not exists thread_id uuid references public.member_message_threads(id) on delete cascade;

with normalized as (
  select user_id,
         regexp_replace(trim(subject), '^(re:[[:space:]]*)+', '', 'i') as base_subject,
         min(created_at) as first_message_at
  from public.member_messages
  group by user_id, regexp_replace(trim(subject), '^(re:[[:space:]]*)+', '', 'i')
)
insert into public.member_message_threads (user_id,subject,status,created_at,updated_at)
select n.user_id,n.base_subject,
       coalesce((
         select m.status from public.member_messages m
         where m.user_id=n.user_id
           and regexp_replace(trim(m.subject), '^(re:[[:space:]]*)+', '', 'i')=n.base_subject
           and m.sender_role='member'
         order by m.created_at asc limit 1
       ),'open'),
       n.first_message_at,now()
from normalized n
where not exists (
  select 1 from public.member_message_threads t
  where t.user_id=n.user_id and t.subject=n.base_subject
);

update public.member_messages m
set thread_id=t.id
from public.member_message_threads t
where m.thread_id is null
  and m.user_id=t.user_id
  and regexp_replace(trim(m.subject), '^(re:[[:space:]]*)+', '', 'i')=t.subject;

delete from public.member_message_threads t
where not exists (select 1 from public.member_messages m where m.thread_id=t.id);

update public.member_message_threads t
set status=coalesce((
  select m.status from public.member_messages m
  where m.thread_id=t.id and m.sender_role='member'
  order by m.created_at asc limit 1
),t.status),
updated_at=now();

alter table public.member_message_threads enable row level security;
drop policy if exists "Members read own message threads or admin" on public.member_message_threads;
create policy "Members read own message threads or admin"
on public.member_message_threads for select to authenticated
using (user_id=(select auth.uid()) or private.is_ftriva_admin());
drop policy if exists "Members create own message threads" on public.member_message_threads;
create policy "Members create own message threads"
on public.member_message_threads for insert to authenticated
with check (user_id=(select auth.uid()) or private.is_ftriva_admin());
drop policy if exists "Admins update message threads" on public.member_message_threads;
create policy "Admins update message threads"
on public.member_message_threads for update to authenticated
using (private.is_ftriva_admin())
with check (private.is_ftriva_admin());
drop policy if exists "Admins delete message threads" on public.member_message_threads;
create policy "Admins delete message threads"
on public.member_message_threads for delete to authenticated
using (private.is_ftriva_admin());

grant select, insert, update, delete on public.member_message_threads to authenticated;
