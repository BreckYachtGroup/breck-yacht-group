-- Run this in Supabase SQL Editor to create the blog posts table

create table if not exists posts (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  title         text not null,
  slug          text unique not null,   -- URL-friendly version of title, e.g. "2024-jupiter-41-review"
  excerpt       text,                   -- Short summary shown on the blog index
  content       text,                   -- Full post body (plain text, one paragraph per line)
  cover_image   text,                   -- URL to a cover photo
  category      text default 'News',    -- e.g. "Industry News", "Boat Review", "Company Update"
  published     boolean default false,  -- Set to true when ready to go live
  published_at  timestamptz default now()
);

-- Allow public read access
alter table posts enable row level security;

create policy "Public can read published posts"
  on posts for select
  using (published = true);

-- Sample post to verify everything works
insert into posts (title, slug, excerpt, content, category, published, published_at)
values (
  'Welcome to The Log — Breck Yacht Group''s Official Blog',
  'welcome-to-the-log',
  'We are excited to launch The Log, your go-to source for yacht market insights, boat reviews, and news from the Breck Yacht Group team.',
  'We are thrilled to introduce The Log, the official blog of Breck Yacht Group.

Here you will find the latest news from the world of luxury performance boating, in-depth reviews of center consoles and sportfish vessels, market insights, and updates from our team.

Whether you are actively shopping for your next vessel or simply passionate about the water, The Log is designed to keep you informed and inspired.

Stay tuned for more posts coming soon.',
  'Company Update',
  true,
  now()
);
