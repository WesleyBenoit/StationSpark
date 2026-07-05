begin;

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_18_plus boolean not null default false,
  terms_accepted_at timestamptz,
  phone_verified boolean not null default false,
  identity_verified boolean not null default false,
  banned boolean not null default false
);

create table if not exists public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
  display_name text not null,
  bio text,
  profile_photo_url text,
  vehicle_make text,
  vehicle_model text,
  vehicle_color text,
  interests text[] not null default '{}',
  adult_mode_enabled boolean not null default false,
  visibility_mode text not null default 'standard',
  default_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length_check check (char_length(trim(display_name)) between 1 and 48),
  constraint profiles_bio_length_check check (bio is null or char_length(bio) <= 180),
  constraint profiles_visibility_mode_check check (visibility_mode in ('standard', 'station_only', 'hidden', 'ghost')),
  constraint profiles_default_status_check check (
    default_status is null or default_status in (
      'open_to_chat',
      'watching_movie',
      'working',
      'road_tripping',
      'networking',
      'talking_tesla',
      'do_not_disturb',
      'adult_mode_available'
    )
  )
);

create table if not exists public.charging_stations (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  lat double precision not null,
  lng double precision not null,
  charger_count integer not null default 0,
  charger_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  station_id uuid not null references public.charging_stations(id) on delete cascade,
  status text not null,
  visibility text not null default 'standard',
  estimated_departure_at timestamptz,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  active boolean not null default true,
  constraint check_ins_status_check check (
    status in (
      'open_to_chat',
      'watching_movie',
      'working',
      'road_tripping',
      'networking',
      'talking_tesla',
      'do_not_disturb',
      'adult_mode_available'
    )
  ),
  constraint check_ins_visibility_check check (visibility in ('standard', 'station_only', 'hidden', 'ghost'))
);

create index if not exists check_ins_station_active_idx on public.check_ins (station_id, active, started_at desc);
create index if not exists check_ins_user_active_idx on public.check_ins (user_id, active);

create table if not exists public.arrival_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  station_id uuid not null references public.charging_stations(id) on delete cascade,
  eta_at timestamptz not null,
  visibility text not null default 'standard',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint arrival_intents_visibility_check check (visibility in ('standard', 'station_only', 'hidden', 'ghost'))
);

create index if not exists arrival_intents_station_active_idx on public.arrival_intents (station_id, active, eta_at);
create index if not exists arrival_intents_user_active_idx on public.arrival_intents (user_id, active);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  station_id uuid not null references public.charging_stations(id) on delete cascade,
  invite_type text not null,
  message text,
  status text not null default 'pending',
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invites_no_self_check check (sender_id <> recipient_id),
  constraint invites_message_length_check check (message is null or char_length(message) <= 180),
  constraint invites_type_check check (
    invite_type in (
      'chat',
      'movie',
      'talk_ev',
      'business',
      'coffee',
      'road_trip_tips',
      'adult_private'
    )
  ),
  constraint invites_status_check check (status in ('pending', 'accepted', 'declined', 'expired', 'canceled'))
);

create index if not exists invites_sender_idx on public.invites (sender_id, created_at desc);
create index if not exists invites_recipient_idx on public.invites (recipient_id, created_at desc);
create index if not exists invites_pending_expiry_idx on public.invites (expires_at) where status = 'pending';

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null unique references public.invites(id) on delete cascade,
  user_one_id uuid not null references public.users(id) on delete cascade,
  user_two_id uuid not null references public.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint chats_no_self_check check (user_one_id <> user_two_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint messages_body_length_check check (char_length(trim(body)) between 1 and 1000)
);

create index if not exists messages_chat_created_idx on public.messages (chat_id, created_at desc);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint blocks_no_self_check check (blocker_id <> blocked_id),
  constraint blocks_unique_pair unique (blocker_id, blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  reported_user_id uuid not null references public.users(id) on delete cascade,
  station_id uuid references public.charging_stations(id) on delete set null,
  category text not null,
  description text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint reports_description_length_check check (char_length(trim(description)) between 8 and 1000),
  constraint reports_category_check check (
    category in ('harassment', 'safety', 'spam', 'explicit_public_content', 'impersonation', 'other')
  ),
  constraint reports_status_check check (status in ('open', 'reviewing', 'resolved', 'dismissed'))
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.users(id) on delete cascade,
  reviewed_user_id uuid not null references public.users(id) on delete cascade,
  invite_id uuid not null references public.invites(id) on delete cascade,
  respectful boolean,
  showed_up boolean,
  would_meet_again boolean,
  notes text,
  created_at timestamptz not null default now(),
  constraint ratings_no_self_check check (reviewer_id <> reviewed_user_id),
  constraint ratings_unique_review unique (reviewer_id, invite_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  tier text not null default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_tier_check check (tier in ('free', 'premium_monthly', 'premium_yearly')),
  constraint subscriptions_status_check check (
    status is null or status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_invites_updated_at on public.invites;
create trigger set_invites_updated_at
before update on public.invites
for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create or replace function public.contains_explicit_public_content(value text)
returns boolean
language sql
immutable
as $$
  select coalesce(value, '') ~* '\m(hookup|sex|nude|nsfw|fetish|escort|prostitution|trafficking|xxx)\M';
$$;

create or replace function public.contains_unsafe_private_invite_content(value text)
returns boolean
language sql
immutable
as $$
  select coalesce(value, '') ~* '\m(underage|minor|forced?|coerc(e|ion)|rape|nudes?|escort|prostitution|trafficking|paid service|cash app)\M';
$$;

create or replace function public.is_blocked_between(first_user_id uuid, second_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blocks b
    where (b.blocker_id = first_user_id and b.blocked_id = second_user_id)
       or (b.blocker_id = second_user_id and b.blocked_id = first_user_id)
  );
$$;

create or replace function public.current_user_is_banned()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select u.banned from public.users u where u.id = auth.uid()), true);
$$;

create or replace function public.current_user_can_use_app()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.is_18_plus = true
      and u.terms_accepted_at is not null
      and u.banned = false
  );
$$;

create or replace function public.can_pair_adult(viewer_id uuid, subject_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users viewer_user
    join public.profiles viewer_profile on viewer_profile.id = viewer_user.id
    join public.users subject_user on subject_user.id = subject_id
    join public.profiles subject_profile on subject_profile.id = subject_user.id
    where viewer_user.id = viewer_id
      and viewer_user.is_18_plus = true
      and subject_user.is_18_plus = true
      and viewer_user.terms_accepted_at is not null
      and subject_user.terms_accepted_at is not null
      and viewer_profile.adult_mode_enabled = true
      and subject_profile.adult_mode_enabled = true
      and viewer_user.banned = false
      and subject_user.banned = false
  );
$$;

create or replace function public.user_can_use_adult_status(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    join public.profiles p on p.id = u.id
    where u.id = target_user_id
      and u.is_18_plus = true
      and u.terms_accepted_at is not null
      and u.banned = false
      and p.adult_mode_enabled = true
  );
$$;

create or replace function public.can_send_invite(
  sender_user_id uuid,
  recipient_user_id uuid,
  requested_invite_type text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select sender_user_id = auth.uid()
    and sender_user_id <> recipient_user_id
    and not public.is_blocked_between(sender_user_id, recipient_user_id)
    and exists (
      select 1 from public.users u
      where u.id = sender_user_id
        and u.banned = false
        and u.is_18_plus = true
        and u.terms_accepted_at is not null
    )
    and exists (
      select 1 from public.users u
      where u.id = recipient_user_id
        and u.banned = false
        and u.is_18_plus = true
        and u.terms_accepted_at is not null
    )
    and (
      requested_invite_type <> 'adult_private'
      or public.can_pair_adult(sender_user_id, recipient_user_id)
    );
$$;

create or replace function public.can_send_chat_message(target_chat_id uuid, sender_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chats c
    join public.invites i on i.id = c.invite_id
    where c.id = target_chat_id
      and c.active = true
      and i.status = 'accepted'
      and sender_user_id in (c.user_one_id, c.user_two_id)
      and sender_user_id = auth.uid()
      and public.current_user_can_use_app()
      and not exists (
        select 1
        from public.users u
        where u.id in (c.user_one_id, c.user_two_id)
          and (
            u.banned = true
            or u.is_18_plus = false
            or u.terms_accepted_at is null
          )
      )
      and not public.is_blocked_between(c.user_one_id, c.user_two_id)
  );
$$;

create or replace function public.validate_profile_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.contains_explicit_public_content(new.display_name) or public.contains_explicit_public_content(new.bio) then
    raise exception 'Public profile fields cannot contain explicit adult content.';
  end if;

  if new.adult_mode_enabled = true and not exists (
    select 1
    from public.users u
    where u.id = new.id
      and u.is_18_plus = true
      and u.terms_accepted_at is not null
      and u.banned = false
  ) then
    raise exception 'Private Intent requires an active 18+ account.';
  end if;

  if 'Adult connection' = any(new.interests) and new.adult_mode_enabled = false then
    raise exception 'Adult connection interest requires Private Intent.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_profile_before_write on public.profiles;
create trigger validate_profile_before_write
before insert or update on public.profiles
for each row execute function public.validate_profile_before_write();

create or replace function public.validate_check_in_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'adult_mode_available' and public.user_can_use_adult_status(new.user_id) = false then
    raise exception 'Private Intent status requires Private Intent.';
  end if;

  if exists (select 1 from public.users u where u.id = new.user_id and u.banned = true) then
    raise exception 'Banned users cannot check in.';
  end if;

  if new.active = false and new.ended_at is null then
    new.ended_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists validate_check_in_before_write on public.check_ins;
create trigger validate_check_in_before_write
before insert or update on public.check_ins
for each row execute function public.validate_check_in_before_write();

create or replace function public.validate_invite_before_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'pending' then
      raise exception 'New invites must start pending.';
    end if;

    if new.expires_at is null then
      new.expires_at = now() + interval '10 minutes';
    end if;

    if new.expires_at > now() + interval '30 minutes' then
      raise exception 'Invite expiration is too long.';
    end if;

    if public.can_send_invite(new.sender_id, new.recipient_id, new.invite_type) = false then
      raise exception 'Invite is not allowed.';
    end if;

    if new.invite_type = 'adult_private' and (new.message is null or char_length(trim(new.message)) < 12) then
      raise exception 'Private Intent invites require a short message before acceptance.';
    end if;

    if new.invite_type = 'adult_private' and public.contains_unsafe_private_invite_content(new.message) then
      raise exception 'Private Intent invite blocked by safety policy.';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if old.sender_id <> new.sender_id
      or old.recipient_id <> new.recipient_id
      or old.station_id <> new.station_id
      or old.invite_type <> new.invite_type
      or old.message is distinct from new.message
      or old.expires_at <> new.expires_at then
      raise exception 'Invite routing fields are immutable.';
    end if;

    if old.status <> new.status then
      if old.status <> 'pending' then
        raise exception 'Only pending invites can change state.';
      end if;

      if new.status = 'accepted' and auth.uid() <> old.recipient_id then
        raise exception 'Only the recipient can accept an invite.';
      end if;

      if new.status = 'declined' and auth.uid() <> old.recipient_id then
        raise exception 'Only the recipient can decline an invite.';
      end if;

      if new.status = 'canceled' and auth.uid() <> old.sender_id then
        raise exception 'Only the sender can cancel an invite.';
      end if;

      if new.status = 'expired' and old.expires_at > now() then
        raise exception 'Invite has not expired yet.';
      end if;

      if new.status = 'accepted' and old.expires_at <= now() then
        raise exception 'Expired invites cannot be accepted.';
      end if;

      if public.is_blocked_between(old.sender_id, old.recipient_id) then
        raise exception 'Blocked users cannot interact.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_invite_before_write on public.invites;
create trigger validate_invite_before_write
before insert or update on public.invites
for each row execute function public.validate_invite_before_write();

create or replace function public.validate_message_before_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.chat_id <> new.chat_id
    or old.sender_id <> new.sender_id
    or old.body <> new.body
    or old.created_at <> new.created_at then
    raise exception 'Messages are immutable except soft delete.';
  end if;

  if new.deleted_at is null then
    raise exception 'Message updates must set deleted_at.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_message_before_update on public.messages;
create trigger validate_message_before_update
before update on public.messages
for each row execute function public.validate_message_before_update();

create or replace function public.validate_chat_before_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.invite_id <> new.invite_id
    or old.user_one_id <> new.user_one_id
    or old.user_two_id <> new.user_two_id
    or old.created_at <> new.created_at then
    raise exception 'Chat participants and invite links are immutable.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_chat_before_update on public.chats;
create trigger validate_chat_before_update
before update on public.chats
for each row execute function public.validate_chat_before_update();

create or replace function public.create_chat_when_invite_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status <> 'accepted' and new.status = 'accepted' then
    insert into public.chats (invite_id, user_one_id, user_two_id)
    values (new.id, new.sender_id, new.recipient_id)
    on conflict (invite_id) do update set active = true;
  end if;

  return new;
end;
$$;

drop trigger if exists create_chat_when_invite_accepted on public.invites;
create trigger create_chat_when_invite_accepted
after update on public.invites
for each row execute function public.create_chat_when_invite_accepted();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, is_18_plus, terms_accepted_at)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce((new.raw_user_meta_data ->> 'is_18_plus')::boolean, false),
    case
      when coalesce((new.raw_user_meta_data ->> 'terms_accepted')::boolean, false) then now()
      else null
    end
  )
  on conflict (id) do update set
    email = excluded.email,
    is_18_plus = public.users.is_18_plus or excluded.is_18_plus,
    terms_accepted_at = coalesce(public.users.terms_accepted_at, excluded.terms_accepted_at);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.charging_stations enable row level security;
alter table public.check_ins enable row level security;
alter table public.arrival_intents enable row level security;
alter table public.invites enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.ratings enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "Profile photos are public" on storage.objects;
create policy "Profile photos are public" on storage.objects
for select to anon, authenticated
using (bucket_id = 'profile-photos');

drop policy if exists "Users upload own profile photos" on storage.objects;
create policy "Users upload own profile photos" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.current_user_can_use_app()
);

drop policy if exists "Users update own profile photos" on storage.objects;
create policy "Users update own profile photos" on storage.objects
for update to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.current_user_can_use_app()
);

drop policy if exists "Users delete own profile photos" on storage.objects;
create policy "Users delete own profile photos" on storage.objects
for delete to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can read self" on public.users;
create policy "Users can read self" on public.users
for select to authenticated
using (id = auth.uid());

drop policy if exists "Users can update self basics" on public.users;

drop policy if exists "Profiles are owner-readable" on public.profiles;
create policy "Profiles are owner-readable" on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists "Profiles are owner-insertable" on public.profiles;
create policy "Profiles are owner-insertable" on public.profiles
for insert to authenticated
with check (id = auth.uid() and public.current_user_can_use_app());

drop policy if exists "Profiles are owner-updatable" on public.profiles;
create policy "Profiles are owner-updatable" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and public.current_user_can_use_app());

drop policy if exists "Stations are readable" on public.charging_stations;
create policy "Stations are readable" on public.charging_stations
for select to anon, authenticated
using (true);

drop policy if exists "Check-ins owner select" on public.check_ins;
create policy "Check-ins owner select" on public.check_ins
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Check-ins owner insert" on public.check_ins;
create policy "Check-ins owner insert" on public.check_ins
for insert to authenticated
with check (
  user_id = auth.uid()
  and public.current_user_can_use_app()
  and (status <> 'adult_mode_available' or public.user_can_use_adult_status(auth.uid()))
);

drop policy if exists "Check-ins owner update" on public.check_ins;
create policy "Check-ins owner update" on public.check_ins
for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and public.current_user_can_use_app()
  and (status <> 'adult_mode_available' or public.user_can_use_adult_status(auth.uid()))
);

drop policy if exists "Arrival intents owner select" on public.arrival_intents;
create policy "Arrival intents owner select" on public.arrival_intents
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Arrival intents owner insert" on public.arrival_intents;
create policy "Arrival intents owner insert" on public.arrival_intents
for insert to authenticated
with check (user_id = auth.uid() and public.current_user_can_use_app());

drop policy if exists "Arrival intents owner update" on public.arrival_intents;
create policy "Arrival intents owner update" on public.arrival_intents
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and public.current_user_can_use_app());

drop policy if exists "Invites participant select" on public.invites;
create policy "Invites participant select" on public.invites
for select to authenticated
using (
  auth.uid() in (sender_id, recipient_id)
  and public.current_user_can_use_app()
  and not public.is_blocked_between(sender_id, recipient_id)
);

drop policy if exists "Invites sender insert" on public.invites;
create policy "Invites sender insert" on public.invites
for insert to authenticated
with check (public.can_send_invite(sender_id, recipient_id, invite_type));

drop policy if exists "Invites participant update" on public.invites;
create policy "Invites participant update" on public.invites
for update to authenticated
using (auth.uid() in (sender_id, recipient_id))
with check (auth.uid() in (sender_id, recipient_id) and public.current_user_can_use_app());

drop policy if exists "Chats participant select" on public.chats;
create policy "Chats participant select" on public.chats
for select to authenticated
using (
  auth.uid() in (user_one_id, user_two_id)
  and public.current_user_can_use_app()
  and not public.is_blocked_between(user_one_id, user_two_id)
);

drop policy if exists "Chats participant update" on public.chats;
create policy "Chats participant update" on public.chats
for update to authenticated
using (auth.uid() in (user_one_id, user_two_id))
with check (auth.uid() in (user_one_id, user_two_id) and public.current_user_can_use_app());

drop policy if exists "Messages participant select" on public.messages;
create policy "Messages participant select" on public.messages
for select to authenticated
using (
  exists (
    select 1
    from public.chats c
    where c.id = messages.chat_id
      and auth.uid() in (c.user_one_id, c.user_two_id)
      and public.current_user_can_use_app()
      and not public.is_blocked_between(c.user_one_id, c.user_two_id)
  )
);

drop policy if exists "Messages accepted chat insert" on public.messages;
create policy "Messages accepted chat insert" on public.messages
for insert to authenticated
with check (public.can_send_chat_message(chat_id, sender_id));

drop policy if exists "Messages sender soft delete" on public.messages;
create policy "Messages sender soft delete" on public.messages
for update to authenticated
using (sender_id = auth.uid())
with check (sender_id = auth.uid() and public.current_user_can_use_app());

drop policy if exists "Blocks owner select" on public.blocks;
create policy "Blocks owner select" on public.blocks
for select to authenticated
using (blocker_id = auth.uid() or blocked_id = auth.uid());

drop policy if exists "Blocks owner insert" on public.blocks;
create policy "Blocks owner insert" on public.blocks
for insert to authenticated
with check (blocker_id = auth.uid() and public.current_user_can_use_app());

drop policy if exists "Blocks owner delete" on public.blocks;
create policy "Blocks owner delete" on public.blocks
for delete to authenticated
using (blocker_id = auth.uid());

drop policy if exists "Reports reporter insert" on public.reports;
create policy "Reports reporter insert" on public.reports
for insert to authenticated
with check (reporter_id = auth.uid() and reporter_id <> reported_user_id and public.current_user_can_use_app());

drop policy if exists "Reports reporter select" on public.reports;
create policy "Reports reporter select" on public.reports
for select to authenticated
using (reporter_id = auth.uid());

drop policy if exists "Ratings participant insert" on public.ratings;
create policy "Ratings participant insert" on public.ratings
for insert to authenticated
with check (
  reviewer_id = auth.uid()
  and reviewer_id <> reviewed_user_id
  and exists (
    select 1
    from public.invites i
    where i.id = invite_id
      and i.status = 'accepted'
      and reviewer_id in (i.sender_id, i.recipient_id)
      and reviewed_user_id in (i.sender_id, i.recipient_id)
  )
);

drop policy if exists "Ratings owner select" on public.ratings;
create policy "Ratings owner select" on public.ratings
for select to authenticated
using (reviewer_id = auth.uid() or reviewed_user_id = auth.uid());

drop policy if exists "Subscriptions owner select" on public.subscriptions;
create policy "Subscriptions owner select" on public.subscriptions
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Subscriptions owner insert placeholder" on public.subscriptions;
create policy "Subscriptions owner insert placeholder" on public.subscriptions
for insert to authenticated
with check (user_id = auth.uid() and tier = 'free' and public.current_user_can_use_app());

create or replace view public.station_presence_public
with (security_barrier = true)
as
select
  ci.id as presence_id,
  ci.user_id,
  ci.station_id,
  p.display_name,
  p.profile_photo_url,
  p.vehicle_make,
  p.vehicle_model,
  p.vehicle_color,
  case
    when ci.status = 'adult_mode_available' and not public.can_pair_adult(auth.uid(), ci.user_id) then 'open_to_chat'
    else ci.status
  end as status,
  ci.visibility,
  ci.estimated_departure_at,
  ci.started_at,
  case
    when public.can_pair_adult(auth.uid(), ci.user_id) then p.interests
    else array_remove(p.interests, 'Adult connection')
  end as interests,
  'charging'::text as presence_kind,
  public.can_pair_adult(auth.uid(), ci.user_id) as can_send_adult_invite
from public.check_ins ci
join public.users u on u.id = ci.user_id
join public.profiles p on p.id = ci.user_id
where ci.active = true
  and ci.ended_at is null
  and public.current_user_can_use_app()
  and ci.visibility not in ('hidden', 'ghost')
  and p.visibility_mode not in ('hidden', 'ghost')
  and u.banned = false
  and (auth.uid() = ci.user_id or not public.is_blocked_between(auth.uid(), ci.user_id))
union all
select
  ci.id as presence_id,
  ci.user_id,
  ci.station_id,
  p.display_name,
  p.profile_photo_url,
  p.vehicle_make,
  p.vehicle_model,
  p.vehicle_color,
  case
    when ci.status = 'adult_mode_available' and not public.can_pair_adult(auth.uid(), ci.user_id) then 'open_to_chat'
    else ci.status
  end as status,
  ci.visibility,
  null::timestamptz as estimated_departure_at,
  coalesce(ci.ended_at, ci.started_at) as started_at,
  case
    when public.can_pair_adult(auth.uid(), ci.user_id) then p.interests
    else array_remove(p.interests, 'Adult connection')
  end as interests,
  'recently_active'::text as presence_kind,
  public.can_pair_adult(auth.uid(), ci.user_id) as can_send_adult_invite
from public.check_ins ci
join public.users u on u.id = ci.user_id
join public.profiles p on p.id = ci.user_id
where ci.active = false
  and ci.ended_at >= now() - interval '30 minutes'
  and public.current_user_can_use_app()
  and ci.visibility not in ('hidden', 'ghost')
  and p.visibility_mode not in ('hidden', 'ghost')
  and u.banned = false
  and (auth.uid() = ci.user_id or not public.is_blocked_between(auth.uid(), ci.user_id));

create or replace view public.arrival_intents_public
with (security_barrier = true)
as
select
  ai.id as presence_id,
  ai.user_id,
  ai.station_id,
  p.display_name,
  p.profile_photo_url,
  p.vehicle_make,
  p.vehicle_model,
  p.vehicle_color,
  coalesce(p.default_status, 'open_to_chat') as status,
  ai.visibility,
  ai.eta_at as estimated_departure_at,
  ai.created_at as started_at,
  case
    when public.can_pair_adult(auth.uid(), ai.user_id) then p.interests
    else array_remove(p.interests, 'Adult connection')
  end as interests,
  'on_the_way'::text as presence_kind,
  public.can_pair_adult(auth.uid(), ai.user_id) as can_send_adult_invite
from public.arrival_intents ai
join public.users u on u.id = ai.user_id
join public.profiles p on p.id = ai.user_id
where ai.active = true
  and ai.eta_at >= now()
  and public.current_user_can_use_app()
  and ai.visibility not in ('hidden', 'ghost')
  and p.visibility_mode not in ('hidden', 'ghost')
  and u.banned = false
  and (auth.uid() = ai.user_id or not public.is_blocked_between(auth.uid(), ai.user_id));

create or replace view public.station_activity_summary
with (security_barrier = true)
as
select
  station_id,
  count(*) filter (where presence_kind = 'charging')::integer as charging_count,
  count(*) filter (where presence_kind = 'on_the_way')::integer as on_the_way_count,
  count(*) filter (where presence_kind = 'recently_active')::integer as recently_active_count,
  count(*) filter (where status in ('open_to_chat', 'talking_tesla', 'networking'))::integer as open_to_chat_count,
  array_remove(array_agg(distinct status), null) as active_statuses
from (
  select station_id, status, presence_kind from public.station_presence_public
  union all
  select station_id, status, presence_kind from public.arrival_intents_public
) presence
group by station_id;

grant select on public.station_presence_public to authenticated;
grant select on public.arrival_intents_public to authenticated;
grant select on public.station_activity_summary to authenticated;

create or replace function public.send_invite(
  p_recipient_id uuid,
  p_station_id uuid,
  p_invite_type text,
  p_message text default null
)
returns public.invites
language plpgsql
security definer
set search_path = public
as $$
declare
  created_invite public.invites;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if public.can_send_invite(auth.uid(), p_recipient_id, p_invite_type) = false then
    raise exception 'Invite is not allowed.';
  end if;

  insert into public.invites (sender_id, recipient_id, station_id, invite_type, message)
  values (auth.uid(), p_recipient_id, p_station_id, p_invite_type, nullif(trim(p_message), ''))
  returning * into created_invite;

  return created_invite;
end;
$$;

create or replace function public.accept_invite(p_invite_id uuid)
returns public.chats
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invite public.invites;
  target_chat public.chats;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  update public.invites
  set status = 'expired'
  where id = p_invite_id
    and status = 'pending'
    and expires_at <= now();

  select * into target_invite
  from public.invites
  where id = p_invite_id
  for update;

  if not found then
    raise exception 'Invite not found.';
  end if;

  if target_invite.recipient_id <> auth.uid() then
    raise exception 'Only the recipient can accept this invite.';
  end if;

  if target_invite.status <> 'pending' then
    raise exception 'Only pending invites can be accepted.';
  end if;

  if target_invite.expires_at <= now() then
    raise exception 'Expired invites cannot be accepted.';
  end if;

  if public.is_blocked_between(target_invite.sender_id, target_invite.recipient_id) then
    raise exception 'Blocked users cannot interact.';
  end if;

  update public.invites
  set status = 'accepted'
  where id = p_invite_id;

  select * into target_chat
  from public.chats
  where invite_id = p_invite_id;

  return target_chat;
end;
$$;

create or replace function public.expire_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer;
begin
  update public.invites
  set status = 'expired'
  where status = 'pending'
    and expires_at <= now();

  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

comment on function public.expire_invites() is 'Schedule this in Supabase cron every minute: select public.expire_invites();';

commit;
