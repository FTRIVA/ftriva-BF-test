create or replace function private.touch_member_message_thread()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.thread_id is not null then
    update public.member_message_threads
    set updated_at = now()
    where id = new.thread_id;
  end if;
  return new;
end;
$function$;

drop trigger if exists member_messages_touch_thread on public.member_messages;
create trigger member_messages_touch_thread
after insert or update of message on public.member_messages
for each row execute function private.touch_member_message_thread();
