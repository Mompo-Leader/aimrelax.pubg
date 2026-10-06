-- AIMRELAX LIVE V2: LiveKit metadata + chat.
-- Safe migration: does NOT drop live_signals or existing live_streams data.

alter table public.live_streams
  add column if not exists provider text not null default 'livekit',
  add column if not exists livekit_room_name text,
  add column if not exists playback_url text,
  add column if not exists thumbnail_url text;

update public.live_streams
set provider = 'livekit'
where provider is null;

create unique index if not exists live_streams_livekit_room_name_uidx
  on public.live_streams(livekit_room_name)
  where livekit_room_name is not null;

create table if not exists public.live_chat (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.live_streams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null default 'Viewer',
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.live_likes (
  stream_id uuid not null references public.live_streams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (stream_id, user_id)
);

create table if not exists public.live_viewers (
  stream_id uuid not null references public.live_streams(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  primary key (stream_id, viewer_id)
);

alter table public.live_chat enable row level security;
alter table public.live_likes enable row level security;
alter table public.live_viewers enable row level security;

create policy "live chat read" on public.live_chat for select using (true);
create policy "live chat insert own" on public.live_chat for insert with check (auth.uid() = user_id);
create policy "live likes read" on public.live_likes for select using (true);
create policy "live likes own" on public.live_likes for insert with check (auth.uid() = user_id);
create policy "live likes delete own" on public.live_likes for delete using (auth.uid() = user_id);
create policy "live viewers read" on public.live_viewers for select using (true);

create or replace function public.live_like_count(p_stream_id uuid)
returns bigint language sql stable security definer set search_path = public
as $$ select count(*) from public.live_likes where stream_id = p_stream_id $$;

create or replace function public.refresh_live_viewer_count(p_stream_id uuid)
returns bigint language plpgsql security definer set search_path = public
as $$
declare c bigint;
begin
  delete from public.live_viewers where stream_id = p_stream_id and last_seen_at < now() - interval '45 seconds';
  select count(*) into c from public.live_viewers where stream_id = p_stream_id;
  update public.live_streams set viewer_count = c where id = p_stream_id;
  return c;
end;
$$;

alter table public.live_streams replica identity full;
alter table public.live_chat replica identity full;
alter table public.live_likes replica identity full;

-- If realtime is already configured, duplicate-add may fail harmlessly in dashboard.
do $$ begin
  alter publication supabase_realtime add table public.live_streams;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.live_chat;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.live_likes;
exception when duplicate_object then null;
end $$;
