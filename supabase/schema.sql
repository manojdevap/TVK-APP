-- Nandhivaram Guduvancheri Municipality — Ward Tracker
-- Run this in Supabase Dashboard → SQL Editor

-- Extensions
create extension if not exists "uuid-ossp";

-- Scope: municipality now, constituency later
create type scope_type as enum ('municipality', 'constituency');
create type user_role as enum ('ward_member', 'ward_organiser', 'ward_head', 'admin');
create type gender_type as enum ('male', 'female');
create type event_status as enum ('planned', 'ongoing', 'completed', 'cancelled');
create type petition_status as enum ('submitted', 'in_progress', 'resolved', 'rejected');
create type department_key as enum (
  'electricity_board', 'revenue_board', 'corporation',
  'water_board', 'police', 'other'
);

-- Departments (reference)
create table departments (
  key department_key primary key,
  name_en text not null,
  name_ta text not null
);

insert into departments (key, name_en, name_ta) values
  ('electricity_board', 'Electricity Board', 'மின்சார வாரியம்'),
  ('revenue_board', 'Revenue Board', 'வருவாய் வாரியம்'),
  ('corporation', 'Corporation', 'மாநகராட்சி'),
  ('water_board', 'Water Board', 'நீர் வாரியம்'),
  ('police', 'Police', 'காவல்துறை'),
  ('other', 'Other', 'மற்றவை');

-- Wards
create table wards (
  id uuid primary key default gen_random_uuid(),
  number int not null,
  name_en text not null,
  name_ta text not null default '',
  area_en text not null default '',
  area_ta text not null default '',
  total_voters int not null default 0,
  our_votes int not null default 0,
  male_voters int not null default 0,
  female_voters int not null default 0,
  scope scope_type not null default 'municipality',
  municipality_slug text not null default 'nandhivaram_guduvancheri',
  created_at timestamptz not null default now(),
  unique (municipality_slug, number)
);

-- Profiles (party members / volunteers — linked to auth.users when they log in)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  username text not null,
  address text not null default '',
  voter_id text unique,
  ward_id uuid references wards(id) on delete set null,
  role user_role not null default 'ward_member',
  gender gender_type not null,
  phone text,
  is_our_vote boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Ward leadership references (added after profiles exist)
alter table wards add column head_id uuid references profiles(id) on delete set null;
alter table wards add column organiser_id uuid references profiles(id) on delete set null;

-- Events
create table events (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_ta text not null default '',
  description_en text not null default '',
  description_ta text not null default '',
  ward_id uuid not null references wards(id) on delete cascade,
  event_date date not null,
  location text not null default '',
  status event_status not null default 'planned',
  organiser_id uuid references profiles(id) on delete set null,
  photos text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table event_participants (
  event_id uuid references events(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  primary key (event_id, profile_id)
);

create table event_invites (
  event_id uuid references events(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  primary key (event_id, profile_id)
);

-- Petitions
create table petitions (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_ta text not null default '',
  description_en text not null default '',
  description_ta text not null default '',
  ward_id uuid not null references wards(id) on delete cascade,
  petitioner_id uuid references profiles(id) on delete set null,
  department department_key not null references departments(key),
  status petition_status not null default 'submitted',
  submitted_at date not null default current_date,
  photos text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (auth_user_id, username, gender, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'male',
    'ward_member'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: check admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where auth_user_id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- RLS
alter table departments enable row level security;
alter table wards enable row level security;
alter table profiles enable row level security;
alter table events enable row level security;
alter table event_participants enable row level security;
alter table event_invites enable row level security;
alter table petitions enable row level security;

-- Public read
create policy "departments_read" on departments for select using (true);
create policy "wards_read" on wards for select using (true);
create policy "profiles_read" on profiles for select using (true);
create policy "events_read" on events for select using (true);
create policy "event_participants_read" on event_participants for select using (true);
create policy "event_invites_read" on event_invites for select using (true);
create policy "petitions_read" on petitions for select using (true);

-- Admin write
create policy "wards_admin" on wards for all using (public.is_admin());
create policy "profiles_admin" on profiles for all using (public.is_admin());
create policy "events_admin" on events for all using (public.is_admin());
create policy "event_participants_admin" on event_participants for all using (public.is_admin());
create policy "event_invites_admin" on event_invites for all using (public.is_admin());
create policy "petitions_admin" on petitions for all using (public.is_admin());

-- Image storage: run supabase/storage.sql to create buckets + policies
-- Buckets: profile-photos, event-photos, petition-photos (public URLs saved in DB)

-- Seed all 30 wards for Nandhivaram Guduvancheri (edit names/areas via admin panel)
insert into wards (number, name_en, name_ta, area_en, area_ta, total_voters, our_votes, male_voters, female_voters)
select
  n,
  'Ward ' || n,
  'வார்டு ' || n,
  '',
  '',
  0,
  0,
  0,
  0
from generate_series(1, 30) as n
on conflict (municipality_slug, number) do nothing;

-- Enrich first 3 wards with sample area names (optional)
update wards set
  name_en = 'Ward 1 — Nandhivaram',
  name_ta = 'வார்டு 1 — நந்திவரம்',
  area_en = 'Nandhivaram Main Road',
  area_ta = 'நந்திவரம் முதன்மை சாலை',
  total_voters = 3200, our_votes = 1280, male_voters = 1600, female_voters = 1600
where municipality_slug = 'nandhivaram_guduvancheri' and number = 1;

update wards set
  name_en = 'Ward 2 — Guduvancheri',
  name_ta = 'வார்டு 2 — குடுவாஞ்சேரி',
  area_en = 'Guduvancheri Bus Stand Area',
  area_ta = 'குடுவாஞ்சேரி பேருந்து நிலையம்',
  total_voters = 4100, our_votes = 1640, male_voters = 2050, female_voters = 2050
where municipality_slug = 'nandhivaram_guduvancheri' and number = 2;

update wards set
  name_en = 'Ward 3 — Perungalathur Border',
  name_ta = 'வார்டு 3 — பெருங்களத்தூர் எல்லை',
  area_en = 'GST Road Vicinity',
  area_ta = 'ஜிஎஸ்டி சாலை அருகில்',
  total_voters = 3800, our_votes = 1520, male_voters = 1900, female_voters = 1900
where municipality_slug = 'nandhivaram_guduvancheri' and number = 3;

-- After first login, promote yourself to admin:
-- update profiles set role = 'admin' where auth_user_id = '<your-auth-user-uuid>';

-- Optional demo data with sample images: run supabase/seed.sql
