-- Run this in your Supabase project's SQL Editor
-- Dashboard → SQL Editor → New query → paste and run

-- Messages table (chat transcripts)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  speaker text not null,
  content text not null,
  timestamp text,
  avatar_color text not null default '#ffffff',
  created_at timestamptz not null default now()
);

-- Images table (gallery photos)
create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  blob_url text not null,
  filename text not null,
  category text default 'General',
  sort_order integer not null default 0,
  uploaded_at timestamptz not null default now()
);

-- Music tracks table
create table if not exists music_tracks (
  id uuid primary key default gen_random_uuid(),
  blob_url text not null,
  title text not null,
  artist text not null default '',
  duration integer not null default 0,
  sort_order integer not null default 0,
  uploaded_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table messages enable row level security;
alter table images enable row level security;
alter table music_tracks enable row level security;

-- Allow public (anon) read + write — app handles auth itself
create policy "public read messages" on messages for select using (true);
create policy "public insert messages" on messages for insert with check (true);
create policy "public delete messages" on messages for delete using (true);

create policy "public read images" on images for select using (true);
create policy "public insert images" on images for insert with check (true);
create policy "public delete images" on images for delete using (true);

create policy "public read music_tracks" on music_tracks for select using (true);
create policy "public insert music_tracks" on music_tracks for insert with check (true);
create policy "public delete music_tracks" on music_tracks for delete using (true);

-- Photo comments table (gallery comments)
create table if not exists photo_comments (
  id uuid primary key default gen_random_uuid(),
  image_id uuid not null references images(id) on delete cascade,
  author text not null default 'Anonymous',
  content text not null,
  created_at timestamptz not null default now()
);

alter table photo_comments enable row level security;

create policy "public read photo_comments" on photo_comments for select using (true);
create policy "public insert photo_comments" on photo_comments for insert with check (true);
