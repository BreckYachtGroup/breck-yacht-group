-- Run this in your Supabase project: SQL Editor → New Query → paste and run

create table if not exists vessels (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  name            text not null,
  make            text,
  model           text,
  year            int,
  length_ft       numeric,
  beam_ft         numeric,
  price           numeric not null,
  status          text default 'available' check (status in ('available', 'sold', 'under_contract')),
  location        text,
  description     text,
  engine_details  text,
  hours           int,
  fuel_type       text,
  images          text[],   -- array of image URLs
  featured        boolean default false,
  slug            text unique not null  -- used in the URL, e.g. "2024-jupiter-41-fs"
);

-- Allow public read access (no login required to browse listings)
alter table vessels enable row level security;

create policy "Public can read vessels"
  on vessels for select
  using (true);

-- Sample vessel to verify everything works
insert into vessels (name, make, model, year, length_ft, beam_ft, price, status, location, description, engine_details, hours, fuel_type, images, featured, slug)
values (
  '2024 Jupiter 41 FS',
  'Jupiter',
  '41 Forward Seating',
  2024,
  41,
  10.5,
  649000,
  'available',
  'Miami, FL',
  'Stunning 2024 Jupiter 41 FS in pristine condition. Triple Yamaha 425 XTO power, custom SeaDek flooring, Garmin electronics package, and freshwater flush system throughout.',
  'Triple Yamaha 425 XTO',
  45,
  'Gas',
  ARRAY['https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1200'],
  true,
  '2024-jupiter-41-fs'
);
