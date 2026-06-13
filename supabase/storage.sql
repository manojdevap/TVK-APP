-- Supabase Storage setup for TVK Ward Tracker
-- Run in Supabase Dashboard → SQL Editor (after main schema.sql)

-- Create public buckets (free tier: 1 GB total across all buckets)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'profile-photos',
    'profile-photos',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'event-photos',
    'event-photos',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'petition-photos',
    'petition-photos',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
on conflict (id) do nothing;

-- Public read for all TVK media buckets
create policy "tvk_media_public_read"
  on storage.objects for select
  using (bucket_id in ('profile-photos', 'event-photos', 'petition-photos'));

-- Admin upload/update/delete (uses is_admin() from schema.sql)
create policy "tvk_media_admin_write"
  on storage.objects for all
  using (
    bucket_id in ('profile-photos', 'event-photos', 'petition-photos')
    and public.is_admin()
  );

-- Optional: allow authenticated users to upload their own profile photo only
-- create policy "profile_self_upload"
--   on storage.objects for insert
--   with check (
--     bucket_id = 'profile-photos'
--     and auth.uid()::text = (storage.foldername(name))[1]
--   );
