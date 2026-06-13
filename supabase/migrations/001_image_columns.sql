-- Run if database already exists — adds image columns + storage-ready fields

alter table profiles
  add column if not exists avatar_url text;

alter table petitions
  add column if not exists photos text[] not null default '{}';

comment on column profiles.avatar_url is 'Public URL from Supabase Storage bucket profile-photos';
comment on column events.photos is 'Public URLs from Supabase Storage bucket event-photos';
comment on column petitions.photos is 'Public URLs from Supabase Storage bucket petition-photos';
