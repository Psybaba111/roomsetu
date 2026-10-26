create table if not exists flat_clubs (
  id text primary key,
  listing_id text not null references listings(id) on delete cascade,
  city_id text not null,
  locality_id text not null,
  seats int not null,
  status text not null default 'forming',
  note text not null default '',
  is_demo boolean not null default false,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flat_club_members (
  club_id text not null references flat_clubs(id) on delete cascade,
  user_id text not null,
  wanted_id text,
  status text not null default 'suggested',
  created_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create unique index if not exists flat_clubs_one_open_idx
  on flat_clubs (listing_id)
  where status in ('forming', 'proposed', 'accepted');

insert into room_wanted (
  id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in,
  duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle
) values
  ('demo:want:dadar1', 'demo:buddy:1', true, 'Neha Shah', 28, 'woman', 'Designer', 'mumbai', 'Dadar', 20000, '2026-11-08', 11, '3bhk', 'furnished', 'either', 'no', 'no', 'any', 1, 'Looking to share a 3 BHK in Dadar with two others. Demo request.', 'Quiet weeknights, works from the flat two days.'),
  ('demo:want:dadar2', 'demo:buddy:2', true, 'Kabir Mehta', 26, 'man', 'Analyst', 'mumbai', 'Dadar', 18000, '2026-11-12', 11, '3bhk', 'semi', 'either', 'no', 'no', 'any', 1, 'Wants one bedroom in a Dadar 3 BHK, not a PG. Demo request.', 'Early mornings, no smoking.'),
  ('demo:want:dadar3', 'demo:buddy:3', true, 'Ananya Iyer', 29, 'woman', 'Product manager', 'mumbai', 'Dadar', 22000, '2026-11-06', 12, '3bhk', 'furnished', 'either', 'no', 'no', 'any', 1, 'Can move with two flatmates if the rent is split. Demo request.', 'Cooks most nights, prefers a family-friendly building.')
on conflict (id) do nothing;

insert into flat_clubs (id, listing_id, city_id, locality_id, seats, status, note, is_demo, created_by)
values (
  'demo:club:dadar', 'demo:lst:20', 'mumbai', 'mumbai:dadar', 3, 'proposed',
  'Three people already searching in Dadar. Their budgets together cover the rent.',
  true, 'demo:buddy:1'
) on conflict (id) do nothing;

insert into flat_club_members (club_id, user_id, wanted_id, status) values
  ('demo:club:dadar', 'demo:buddy:1', 'demo:want:dadar1', 'in'),
  ('demo:club:dadar', 'demo:buddy:2', 'demo:want:dadar2', 'in'),
  ('demo:club:dadar', 'demo:buddy:3', 'demo:want:dadar3', 'in')
on conflict (club_id, user_id) do nothing;
