-- RoomSetu marketplace schema and clearly marked demo seed.
-- Demo rows use owner ids starting with demo: and is_demo = true.

create table if not exists cities (
  id text primary key,
  name text not null,
  state text not null,
  sort_order int not null default 0
);

create table if not exists localities (
  id text primary key,
  city_id text not null references cities(id),
  name text not null,
  lat double precision,
  lng double precision
);

create table if not exists amenities (
  id text primary key,
  label text not null
);

create table if not exists profiles (
  user_id text primary key,
  full_name text not null default '',
  email text not null default '',
  mobile text not null default '',
  age int,
  gender text not null default '',
  city_id text,
  occupation text not null default '',
  user_type text not null default 'looking',
  preferred_cities text not null default '',
  about text not null default '',
  lifestyle jsonb not null default '{}'::jsonb,
  privacy jsonb not null default '{"profile":"public","contact":"hidden","listing":"public"}'::jsonb,
  role text not null default 'member',
  verification_status text not null default 'unverified',
  phone_verified boolean not null default false,
  email_verified boolean not null default false,
  suspended boolean not null default false,
  is_demo boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists properties (
  id text primary key,
  owner_id text not null,
  title text not null,
  property_type text not null,
  city_id text not null,
  locality_id text not null,
  address text not null default '',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists listings (
  id text primary key,
  property_id text references properties(id),
  owner_id text not null,
  is_demo boolean not null default false,
  title text not null,
  property_type text not null,
  room_type text not null,
  address text not null default '',
  city_id text not null,
  locality_id text not null,
  pincode text not null default '',
  lat double precision,
  lng double precision,
  monthly_rent int not null,
  deposit int not null default 0,
  available_from date not null,
  min_stay_months int not null default 1,
  max_stay_months int,
  furnished text not null default 'semi',
  gender_pref text not null default 'any',
  age_min int,
  age_max int,
  occupant_pref text not null default 'any',
  roommate_pref text not null default '',
  occupants int not null default 0,
  description text not null default '',
  house_rules text not null default '',
  guest_policy text not null default 'Occasional guests with notice',
  food_available boolean not null default false,
  smoking_allowed boolean not null default false,
  pets_allowed boolean not null default false,
  status text not null default 'active',
  verification_status text not null default 'unverified',
  quality_score int not null default 70,
  views int not null default 0,
  plan text not null default 'free',
  featured boolean not null default false,
  boost_requested boolean not null default false,
  duplicate_suspect boolean not null default false,
  fraud_flag boolean not null default false,
  cover_image text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists listing_amenities (
  listing_id text not null references listings(id) on delete cascade,
  amenity_id text not null,
  primary key (listing_id, amenity_id)
);

create table if not exists listing_photos (
  id text primary key,
  listing_id text not null references listings(id) on delete cascade,
  url text not null,
  category text not null,
  sort_order int not null default 0
);

create table if not exists room_wanted (
  id text primary key,
  owner_id text not null,
  is_demo boolean not null default false,
  name text not null,
  age int,
  gender text not null,
  occupation text not null,
  city_id text not null,
  localities text not null default '',
  budget int not null,
  move_in date not null,
  duration_months int not null default 6,
  room_pref text not null default 'private',
  furnished text not null default 'semi',
  food_pref text not null default 'either',
  smoking text not null default 'no',
  pets text not null default 'no',
  roommate_gender text not null default 'any',
  people int not null default 1,
  bio text not null default '',
  lifestyle text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversations (
  id text primary key,
  listing_id text,
  room_wanted_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversation_members (
  conversation_id text not null references conversations(id) on delete cascade,
  user_id text not null,
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists messages (
  id text primary key,
  conversation_id text not null references conversations(id) on delete cascade,
  sender_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists saved_listings (
  user_id text not null,
  listing_id text not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table if not exists applications (
  id text primary key,
  listing_id text not null references listings(id) on delete cascade,
  user_id text not null,
  message text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists recorded_matches (
  id text primary key,
  seeker_id text not null,
  listing_id text not null,
  score int not null,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key,
  user_id text not null,
  kind text not null,
  title text not null,
  body text not null default '',
  href text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id text primary key,
  reporter_id text not null,
  target_type text not null,
  target_id text not null,
  category text not null,
  details text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists blocks (
  user_id text not null,
  blocked_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_id)
);

create table if not exists verification_requests (
  id text primary key,
  user_id text not null,
  listing_id text,
  kind text not null,
  status text not null default 'pending',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_log (
  id text primary key,
  actor_id text not null,
  action text not null,
  target text not null default '',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists dashboard_layouts (
  user_id text primary key,
  widgets jsonb not null
);

create table if not exists subscriptions (
  id text primary key,
  user_id text not null,
  plan text not null,
  status text not null default 'inactive',
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id text primary key,
  user_id text not null,
  purpose text not null,
  amount_inr int not null,
  status text not null,
  provider text not null default 'razorpay',
  reference_id text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id text primary key,
  author_id text not null,
  listing_id text,
  rating int not null,
  body text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists search_events (
  id text primary key,
  user_id text,
  city_id text,
  query text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists listings_city_idx on listings (city_id);
create index if not exists listings_locality_idx on listings (locality_id);
create index if not exists listings_rent_idx on listings (monthly_rent);
create index if not exists listings_available_idx on listings (available_from);
create index if not exists listings_status_idx on listings (status);
create index if not exists listings_owner_idx on listings (owner_id);
create index if not exists listings_type_idx on listings (room_type);
create index if not exists room_wanted_city_idx on room_wanted (city_id);
create index if not exists room_wanted_owner_idx on room_wanted (owner_id);
create index if not exists messages_conv_idx on messages (conversation_id, created_at);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);
create index if not exists reports_status_idx on reports (status);

insert into amenities (id, label) values ('wifi', 'Wi-Fi') on conflict (id) do nothing;
insert into amenities (id, label) values ('ac', 'AC') on conflict (id) do nothing;
insert into amenities (id, label) values ('kitchen', 'Kitchen access') on conflict (id) do nothing;
insert into amenities (id, label) values ('washing', 'Washing machine') on conflict (id) do nothing;
insert into amenities (id, label) values ('parking', 'Parking') on conflict (id) do nothing;
insert into amenities (id, label) values ('backup', 'Power backup') on conflict (id) do nothing;
insert into amenities (id, label) values ('lift', 'Lift') on conflict (id) do nothing;
insert into amenities (id, label) values ('housekeeping', 'Housekeeping') on conflict (id) do nothing;
insert into amenities (id, label) values ('attached_bath', 'Attached bathroom') on conflict (id) do nothing;
insert into amenities (id, label) values ('balcony', 'Balcony') on conflict (id) do nothing;
insert into amenities (id, label) values ('food', 'Food available') on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('bengaluru', 'Bengaluru', 'Karnataka', 0) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('bengaluru:indiranagar', 'bengaluru', 'Indiranagar', 12.9784, 77.6408) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('bengaluru:koramangala', 'bengaluru', 'Koramangala', 12.9352, 77.6245) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('bengaluru:whitefield', 'bengaluru', 'Whitefield', 12.9698, 77.75) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('bengaluru:jayanagar', 'bengaluru', 'Jayanagar', 12.9308, 77.5838) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('bengaluru:hsr', 'bengaluru', 'HSR Layout', 12.9121, 77.6446) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('mumbai', 'Mumbai', 'Maharashtra', 1) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('mumbai:andheri', 'mumbai', 'Andheri', 19.1136, 72.8697) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('mumbai:bandra', 'mumbai', 'Bandra', 19.0596, 72.8295) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('mumbai:powai', 'mumbai', 'Powai', 19.1176, 72.906) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('mumbai:dadar', 'mumbai', 'Dadar', 19.0178, 72.8478) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('delhi-ncr', 'Delhi NCR', 'Delhi', 2) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('delhi-ncr:saket', 'delhi-ncr', 'Saket', 28.5245, 77.2066) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('delhi-ncr:hauz-khas', 'delhi-ncr', 'Hauz Khas', 28.5494, 77.2001) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('delhi-ncr:dwarka', 'delhi-ncr', 'Dwarka', 28.5921, 77.046) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('delhi-ncr:karol-bagh', 'delhi-ncr', 'Karol Bagh', 28.6517, 77.1907) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('hyderabad', 'Hyderabad', 'Telangana', 3) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('hyderabad:madhapur', 'hyderabad', 'Madhapur', 17.4483, 78.3915) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('hyderabad:gachibowli', 'hyderabad', 'Gachibowli', 17.4401, 78.3489) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('hyderabad:kondapur', 'hyderabad', 'Kondapur', 17.464, 78.3639) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('pune', 'Pune', 'Maharashtra', 4) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('pune:kothrud', 'pune', 'Kothrud', 18.5074, 73.8077) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('pune:hinjewadi', 'pune', 'Hinjewadi', 18.5913, 73.7389) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('pune:viman-nagar', 'pune', 'Viman Nagar', 18.5679, 73.9143) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('chennai', 'Chennai', 'Tamil Nadu', 5) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('chennai:adyar', 'chennai', 'Adyar', 13.0012, 80.2565) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('chennai:velachery', 'chennai', 'Velachery', 12.975, 80.2206) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('chennai:omr', 'chennai', 'OMR', 12.9105, 80.227) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('kolkata', 'Kolkata', 'West Bengal', 6) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('kolkata:salt-lake', 'kolkata', 'Salt Lake', 22.5867, 88.4172) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('kolkata:ballygunge', 'kolkata', 'Ballygunge', 22.528, 88.3656) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('ahmedabad', 'Ahmedabad', 'Gujarat', 7) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('ahmedabad:satellite', 'ahmedabad', 'Satellite', 23.028, 72.508) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('ahmedabad:navrangpura', 'ahmedabad', 'Navrangpura', 23.036, 72.561) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('gurugram', 'Gurugram', 'Haryana', 8) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('gurugram:dlf', 'gurugram', 'DLF Phase 3', 28.4946, 77.088) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('gurugram:sector-56', 'gurugram', 'Sector 56', 28.425, 77.1) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('noida', 'Noida', 'Uttar Pradesh', 9) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('noida:sector-62', 'noida', 'Sector 62', 28.627, 77.3649) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('noida:sector-137', 'noida', 'Sector 137', 28.511, 77.4109) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('chandigarh', 'Chandigarh', 'Chandigarh', 10) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('chandigarh:sector-17', 'chandigarh', 'Sector 17', 30.7398, 76.7827) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('chandigarh:sector-22', 'chandigarh', 'Sector 22', 30.7333, 76.773) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('jaipur', 'Jaipur', 'Rajasthan', 11) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('jaipur:malviya', 'jaipur', 'Malviya Nagar', 26.854, 75.818) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('jaipur:vaishali', 'jaipur', 'Vaishali Nagar', 26.911, 75.744) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('kochi', 'Kochi', 'Kerala', 12) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('kochi:kakkanad', 'kochi', 'Kakkanad', 10.0159, 76.3419) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('kochi:panampilly', 'kochi', 'Panampilly Nagar', 9.9606, 76.295) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('mangalore', 'Mangalore', 'Karnataka', 13) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('mangalore:kadri', 'mangalore', 'Kadri', 12.888, 74.856) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('mangalore:bejai', 'mangalore', 'Bejai', 12.888, 74.842) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('mysuru', 'Mysuru', 'Karnataka', 14) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('mysuru:vv-mohalla', 'mysuru', 'V.V. Mohalla', 12.315, 76.625) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('mysuru:gokulam', 'mysuru', 'Gokulam', 12.33, 76.63) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('manipal', 'Manipal', 'Karnataka', 15) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('manipal:manipal-campus', 'manipal', 'Near campus', 13.352, 74.786) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('manipal:udupi-road', 'manipal', 'Udupi Road', 13.34, 74.79) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('udupi', 'Udupi', 'Karnataka', 16) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('udupi:kunjibettu', 'udupi', 'Kunjibettu', 13.34, 74.75) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('udupi:malpe-road', 'udupi', 'Malpe Road', 13.35, 74.72) on conflict (id) do nothing;
insert into cities (id, name, state, sort_order) values ('coimbatore', 'Coimbatore', 'Tamil Nadu', 17) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('coimbatore:rs-puram', 'coimbatore', 'R.S. Puram', 11.01, 76.95) on conflict (id) do nothing;
insert into localities (id, city_id, name, lat, lng) values ('coimbatore:gandhipuram', 'coimbatore', 'Gandhipuram', 11.018, 76.967) on conflict (id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h01', 'Meera Kulkarni', 'host1@demo.roomsetu.local', 31, 'woman', 'bengaluru', 'Architect', 'offering',
    'Demo host profile. Meera Kulkarni lists a spare room in Bengaluru. Not a live account.',
    'member', 'verified', true, '2026-10-26T08:46:12.670Z', '2026-08-17T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h02', 'Arjun Menon', 'host2@demo.roomsetu.local', 29, 'man', 'mumbai', 'Product manager', 'offering',
    'Demo host profile. Arjun Menon lists a spare room in Mumbai. Not a live account.',
    'member', 'verified', true, '2026-10-25T08:46:12.670Z', '2026-08-18T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h03', 'Fatima Shaikh', 'host3@demo.roomsetu.local', 34, 'woman', 'delhi-ncr', 'Doctor', 'offering',
    'Demo host profile. Fatima Shaikh lists a spare room in Delhi NCR. Not a live account.',
    'member', 'verified', true, '2026-10-24T08:46:12.670Z', '2026-08-19T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h04', 'Rohit Iyer', 'host4@demo.roomsetu.local', 27, 'man', 'hyderabad', 'Software engineer', 'offering',
    'Demo host profile. Rohit Iyer lists a spare room in Hyderabad. Not a live account.',
    'member', 'verified', true, '2026-10-23T08:46:12.670Z', '2026-08-20T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h05', 'Ananya Rao', 'host5@demo.roomsetu.local', 30, 'woman', 'pune', 'Teacher', 'offering',
    'Demo host profile. Ananya Rao lists a spare room in Pune. Not a live account.',
    'member', 'verified', true, '2026-10-22T08:46:12.670Z', '2026-08-21T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h06', 'Kabir Singh', 'host6@demo.roomsetu.local', 28, 'man', 'chennai', 'Analyst', 'offering',
    'Demo host profile. Kabir Singh lists a spare room in Chennai. Not a live account.',
    'member', 'verified', true, '2026-10-21T08:46:12.670Z', '2026-08-22T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h07', 'Divya Nair', 'host7@demo.roomsetu.local', 26, 'woman', 'kolkata', 'Designer', 'offering',
    'Demo host profile. Divya Nair lists a spare room in Kolkata. Not a live account.',
    'member', 'verified', true, '2026-10-20T08:46:12.670Z', '2026-08-23T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h08', 'Sanjay Patel', 'host8@demo.roomsetu.local', 38, 'man', 'ahmedabad', 'Chartered accountant', 'offering',
    'Demo host profile. Sanjay Patel lists a spare room in Ahmedabad. Not a live account.',
    'member', 'verified', true, '2026-10-19T08:46:12.670Z', '2026-08-24T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h09', 'Lakshmi Reddy', 'host9@demo.roomsetu.local', 44, 'woman', 'gurugram', 'Homemaker and host', 'offering',
    'Demo host profile. Lakshmi Reddy lists a spare room in Gurugram. Not a live account.',
    'member', 'verified', true, '2026-10-18T08:46:12.670Z', '2026-08-25T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h10', 'Imran Qureshi', 'host10@demo.roomsetu.local', 33, 'man', 'noida', 'Chef', 'offering',
    'Demo host profile. Imran Qureshi lists a spare room in Noida. Not a live account.',
    'member', 'verified', true, '2026-10-17T08:46:12.670Z', '2026-08-26T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h11', 'Neha Bansal', 'host11@demo.roomsetu.local', 32, 'woman', 'chandigarh', 'HR manager', 'offering',
    'Demo host profile. Neha Bansal lists a spare room in Chandigarh. Not a live account.',
    'member', 'unverified', true, '2026-10-16T08:46:12.670Z', '2026-08-27T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h12', 'Vikram Shetty', 'host12@demo.roomsetu.local', 41, 'man', 'jaipur', 'PG operator', 'offering',
    'Demo host profile. Vikram Shetty lists a spare room in Jaipur. Not a live account.',
    'member', 'unverified', true, '2026-10-15T08:46:12.670Z', '2026-08-28T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h13', 'Pooja Joshi', 'host13@demo.roomsetu.local', 25, 'woman', 'kochi', 'Researcher', 'offering',
    'Demo host profile. Pooja Joshi lists a spare room in Kochi. Not a live account.',
    'member', 'unverified', true, '2026-10-26T08:46:12.670Z', '2026-08-29T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h14', 'Harish Kamath', 'host14@demo.roomsetu.local', 61, 'man', 'mangalore', 'Retired teacher', 'offering',
    'Demo host profile. Harish Kamath lists a spare room in Mangalore. Not a live account.',
    'member', 'unverified', true, '2026-10-25T08:46:12.670Z', '2026-08-30T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h15', 'Aisha Khan', 'host15@demo.roomsetu.local', 29, 'woman', 'mysuru', 'Nurse', 'offering',
    'Demo host profile. Aisha Khan lists a spare room in Mysuru. Not a live account.',
    'member', 'unverified', true, '2026-10-24T08:46:12.670Z', '2026-08-31T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h16', 'Nikhil Deshmukh', 'host16@demo.roomsetu.local', 36, 'man', 'manipal', 'Sales lead', 'offering',
    'Demo host profile. Nikhil Deshmukh lists a spare room in Manipal. Not a live account.',
    'member', 'unverified', true, '2026-10-23T08:46:12.670Z', '2026-09-01T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h17', 'Sneha Prabhu', 'host17@demo.roomsetu.local', 24, 'woman', 'udupi', 'Student mentor', 'offering',
    'Demo host profile. Sneha Prabhu lists a spare room in Udupi. Not a live account.',
    'member', 'unverified', true, '2026-10-22T08:46:12.670Z', '2026-09-02T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h18', 'Joseph Mathew', 'host18@demo.roomsetu.local', 35, 'man', 'coimbatore', 'Banker', 'offering',
    'Demo host profile. Joseph Mathew lists a spare room in Coimbatore. Not a live account.',
    'member', 'unverified', true, '2026-10-21T08:46:12.670Z', '2026-09-03T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h19', 'Ritika Ghosh', 'host19@demo.roomsetu.local', 28, 'woman', 'bengaluru', 'Editor', 'offering',
    'Demo host profile. Ritika Ghosh lists a spare room in Bengaluru. Not a live account.',
    'member', 'unverified', true, '2026-10-20T08:46:12.670Z', '2026-09-04T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, role, verification_status, is_demo, last_seen_at, created_at)
    values ('demo:h20', 'Aditya Verma', 'host20@demo.roomsetu.local', 39, 'man', 'mumbai', 'Co-living operator', 'offering',
    'Demo host profile. Aditya Verma lists a spare room in Mumbai. Not a live account.',
    'member', 'unverified', true, '2026-10-19T08:46:12.670Z', '2026-09-05T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s01', 'Aman Gupta', 'seeker1@demo.roomsetu.local', 27, 'man', 'bengaluru', 'Software engineer', 'looking',
    'Demo room seeker. Aman Gupta is looking in Bengaluru.',
    true, '2026-10-25T08:46:12.670Z', '2026-09-16T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s02', 'Sana Merchant', 'seeker2@demo.roomsetu.local', 22, 'woman', 'hyderabad', 'Intern', 'looking',
    'Demo room seeker. Sana Merchant is looking in Hyderabad.',
    true, '2026-10-24T08:46:12.670Z', '2026-09-17T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s03', 'Rahul Das', 'seeker3@demo.roomsetu.local', 21, 'man', 'kolkata', 'Student', 'looking',
    'Demo room seeker. Rahul Das is looking in Kolkata.',
    true, '2026-10-23T08:46:12.670Z', '2026-09-18T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s04', 'Priya Krishnan', 'seeker4@demo.roomsetu.local', 26, 'woman', 'noida', 'Designer', 'looking',
    'Demo room seeker. Priya Krishnan is looking in Noida.',
    true, '2026-10-22T08:46:12.670Z', '2026-09-19T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s05', 'Mohammed Irfan', 'seeker5@demo.roomsetu.local', 24, 'man', 'kochi', 'Analyst', 'looking',
    'Demo room seeker. Mohammed Irfan is looking in Kochi.',
    true, '2026-10-21T08:46:12.670Z', '2026-09-20T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s06', 'Tara D''Souza', 'seeker6@demo.roomsetu.local', 28, 'woman', 'manipal', 'Nurse', 'looking',
    'Demo room seeker. Tara D''Souza is looking in Manipal.',
    true, '2026-10-20T08:46:12.670Z', '2026-09-21T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s07', 'Karan Malhotra', 'seeker7@demo.roomsetu.local', 23, 'man', 'bengaluru', 'New joiner', 'looking',
    'Demo room seeker. Karan Malhotra is looking in Bengaluru.',
    true, '2026-10-19T08:46:12.670Z', '2026-09-22T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s08', 'Ishita Bose', 'seeker8@demo.roomsetu.local', 25, 'woman', 'hyderabad', 'Researcher', 'looking',
    'Demo room seeker. Ishita Bose is looking in Hyderabad.',
    true, '2026-10-18T08:46:12.670Z', '2026-09-23T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s09', 'Deepak Yadav', 'seeker9@demo.roomsetu.local', 30, 'man', 'kolkata', 'Sales', 'looking',
    'Demo room seeker. Deepak Yadav is looking in Kolkata.',
    true, '2026-10-17T08:46:12.670Z', '2026-09-24T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s10', 'Nandini Pai', 'seeker10@demo.roomsetu.local', 20, 'woman', 'noida', 'Student', 'looking',
    'Demo room seeker. Nandini Pai is looking in Noida.',
    true, '2026-10-16T08:46:12.670Z', '2026-09-25T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s11', 'Varun Khanna', 'seeker11@demo.roomsetu.local', 29, 'man', 'kochi', 'Software engineer', 'looking',
    'Demo room seeker. Varun Khanna is looking in Kochi.',
    true, '2026-10-15T08:46:12.670Z', '2026-09-26T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s12', 'Leela Thomas', 'seeker12@demo.roomsetu.local', 31, 'woman', 'manipal', 'Teacher', 'looking',
    'Demo room seeker. Leela Thomas is looking in Manipal.',
    true, '2026-10-14T08:46:12.670Z', '2026-09-27T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s13', 'Farhan Ali', 'seeker13@demo.roomsetu.local', 23, 'man', 'bengaluru', 'Intern', 'looking',
    'Demo room seeker. Farhan Ali is looking in Bengaluru.',
    true, '2026-10-13T08:46:12.670Z', '2026-09-28T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s14', 'Shreya Kamat', 'seeker14@demo.roomsetu.local', 27, 'woman', 'hyderabad', 'Product designer', 'looking',
    'Demo room seeker. Shreya Kamat is looking in Hyderabad.',
    true, '2026-10-12T08:46:12.670Z', '2026-09-29T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s15', 'Abhishek Rao', 'seeker15@demo.roomsetu.local', 22, 'man', 'kolkata', 'Student', 'looking',
    'Demo room seeker. Abhishek Rao is looking in Kolkata.',
    true, '2026-10-11T08:46:12.670Z', '2026-09-30T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s16', 'Maya Pillai', 'seeker16@demo.roomsetu.local', 32, 'woman', 'noida', 'Doctor', 'looking',
    'Demo room seeker. Maya Pillai is looking in Noida.',
    true, '2026-10-10T08:46:12.670Z', '2026-10-01T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s17', 'Suresh Babu', 'seeker17@demo.roomsetu.local', 34, 'man', 'kochi', 'Technician', 'looking',
    'Demo room seeker. Suresh Babu is looking in Kochi.',
    true, '2026-10-09T08:46:12.670Z', '2026-10-02T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s18', 'Anjali Mehta', 'seeker18@demo.roomsetu.local', 24, 'woman', 'manipal', 'Analyst', 'looking',
    'Demo room seeker. Anjali Mehta is looking in Manipal.',
    true, '2026-10-08T08:46:12.670Z', '2026-10-03T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s19', 'Omar Siddiqui', 'seeker19@demo.roomsetu.local', 21, 'man', 'bengaluru', 'Student', 'looking',
    'Demo room seeker. Omar Siddiqui is looking in Bengaluru.',
    true, '2026-10-07T08:46:12.670Z', '2026-10-04T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s20', 'Kavya Hegde', 'seeker20@demo.roomsetu.local', 22, 'woman', 'hyderabad', 'Intern', 'looking',
    'Demo room seeker. Kavya Hegde is looking in Hyderabad.',
    true, '2026-10-06T08:46:12.670Z', '2026-10-05T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s21', 'Ramesh Gowda', 'seeker21@demo.roomsetu.local', 26, 'man', 'kolkata', 'Driver turned student', 'looking',
    'Demo room seeker. Ramesh Gowda is looking in Kolkata.',
    true, '2026-10-25T08:46:12.670Z', '2026-10-06T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s22', 'Pallavi Shah', 'seeker22@demo.roomsetu.local', 28, 'woman', 'noida', 'Architect', 'looking',
    'Demo room seeker. Pallavi Shah is looking in Noida.',
    true, '2026-10-24T08:46:12.670Z', '2026-10-07T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s23', 'Dev Sharma', 'seeker23@demo.roomsetu.local', 25, 'man', 'kochi', 'Software engineer', 'looking',
    'Demo room seeker. Dev Sharma is looking in Kochi.',
    true, '2026-10-23T08:46:12.670Z', '2026-10-08T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s24', 'Hannah George', 'seeker24@demo.roomsetu.local', 27, 'woman', 'manipal', 'Nurse', 'looking',
    'Demo room seeker. Hannah George is looking in Manipal.',
    true, '2026-10-22T08:46:12.670Z', '2026-10-09T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s25', 'Yusuf Ahmed', 'seeker25@demo.roomsetu.local', 29, 'man', 'bengaluru', 'Sales', 'looking',
    'Demo room seeker. Yusuf Ahmed is looking in Bengaluru.',
    true, '2026-10-21T08:46:12.670Z', '2026-10-10T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s26', 'Bhavna Jain', 'seeker26@demo.roomsetu.local', 20, 'woman', 'hyderabad', 'Student', 'looking',
    'Demo room seeker. Bhavna Jain is looking in Hyderabad.',
    true, '2026-10-20T08:46:12.670Z', '2026-10-11T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s27', 'Chetan Patil', 'seeker27@demo.roomsetu.local', 31, 'man', 'kolkata', 'Analyst', 'looking',
    'Demo room seeker. Chetan Patil is looking in Kolkata.',
    true, '2026-10-19T08:46:12.670Z', '2026-10-12T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s28', 'Rukmini Iyer', 'seeker28@demo.roomsetu.local', 26, 'woman', 'noida', 'Editor', 'looking',
    'Demo room seeker. Rukmini Iyer is looking in Noida.',
    true, '2026-10-18T08:46:12.670Z', '2026-10-13T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s29', 'Naveen Kumar', 'seeker29@demo.roomsetu.local', 23, 'man', 'kochi', 'New employee', 'looking',
    'Demo room seeker. Naveen Kumar is looking in Kochi.',
    true, '2026-10-17T08:46:12.670Z', '2026-10-14T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into profiles (user_id, full_name, email, age, gender, city_id, occupation, user_type, about, is_demo, last_seen_at, created_at)
    values ('demo:s30', 'Zoya Rahman', 'seeker30@demo.roomsetu.local', 24, 'woman', 'manipal', 'Designer', 'looking',
    'Demo room seeker. Zoya Rahman is looking in Manipal.',
    true, '2026-10-16T08:46:12.670Z', '2026-10-15T08:46:12.670Z')
    on conflict (user_id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:01', 'demo:h01', 'Indiranagar home', 'apartment', 'bengaluru', 'bengaluru:indiranagar', '10, Indiranagar', true, '2026-08-27T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:02', 'demo:h02', 'Bandra home', 'apartment', 'mumbai', 'mumbai:bandra', '11, Bandra', true, '2026-08-28T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:03', 'demo:h03', 'Dwarka home', 'independent_house', 'delhi-ncr', 'delhi-ncr:dwarka', '12, Dwarka', true, '2026-08-29T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:04', 'demo:h04', 'Madhapur home', 'pg', 'hyderabad', 'hyderabad:madhapur', '13, Madhapur', true, '2026-08-30T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:05', 'demo:h05', 'Hinjewadi home', 'coliving', 'pune', 'pune:hinjewadi', '14, Hinjewadi', true, '2026-08-31T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:06', 'demo:h06', 'OMR home', 'apartment', 'chennai', 'chennai:omr', '15, OMR', true, '2026-09-01T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:07', 'demo:h07', 'Salt Lake home', 'apartment', 'kolkata', 'kolkata:salt-lake', '16, Salt Lake', true, '2026-09-02T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:08', 'demo:h08', 'Navrangpura home', 'apartment', 'ahmedabad', 'ahmedabad:navrangpura', '17, Navrangpura', true, '2026-09-03T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:09', 'demo:h09', 'DLF Phase 3 home', 'independent_house', 'gurugram', 'gurugram:dlf', '18, DLF Phase 3', true, '2026-09-04T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:10', 'demo:h10', 'Sector 137 home', 'pg', 'noida', 'noida:sector-137', '19, Sector 137', true, '2026-09-05T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:11', 'demo:h11', 'Sector 17 home', 'coliving', 'chandigarh', 'chandigarh:sector-17', '20, Sector 17', true, '2026-09-06T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:12', 'demo:h12', 'Vaishali Nagar home', 'apartment', 'jaipur', 'jaipur:vaishali', '21, Vaishali Nagar', true, '2026-09-07T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:13', 'demo:h13', 'Kakkanad home', 'apartment', 'kochi', 'kochi:kakkanad', '22, Kakkanad', true, '2026-09-08T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:14', 'demo:h14', 'Bejai home', 'apartment', 'mangalore', 'mangalore:bejai', '23, Bejai', true, '2026-09-09T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:15', 'demo:h15', 'V.V. Mohalla home', 'independent_house', 'mysuru', 'mysuru:vv-mohalla', '24, V.V. Mohalla', true, '2026-09-10T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:16', 'demo:h16', 'Udupi Road home', 'pg', 'manipal', 'manipal:udupi-road', '25, Udupi Road', true, '2026-09-11T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:17', 'demo:h17', 'Kunjibettu home', 'coliving', 'udupi', 'udupi:kunjibettu', '26, Kunjibettu', true, '2026-09-12T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:18', 'demo:h18', 'Gandhipuram home', 'apartment', 'coimbatore', 'coimbatore:gandhipuram', '27, Gandhipuram', true, '2026-09-13T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:19', 'demo:h19', 'Jayanagar home', 'apartment', 'bengaluru', 'bengaluru:jayanagar', '28, Jayanagar', true, '2026-09-14T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:20', 'demo:h20', 'Dadar home', 'apartment', 'mumbai', 'mumbai:dadar', '29, Dadar', true, '2026-09-15T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:21', 'demo:h01', 'Saket home', 'independent_house', 'delhi-ncr', 'delhi-ncr:saket', '30, Saket', true, '2026-09-16T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:22', 'demo:h02', 'Madhapur home', 'pg', 'hyderabad', 'hyderabad:madhapur', '31, Madhapur', true, '2026-09-17T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:23', 'demo:h03', 'Hinjewadi home', 'coliving', 'pune', 'pune:hinjewadi', '32, Hinjewadi', true, '2026-09-18T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:24', 'demo:h04', 'OMR home', 'apartment', 'chennai', 'chennai:omr', '33, OMR', true, '2026-09-19T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:25', 'demo:h05', 'Salt Lake home', 'apartment', 'kolkata', 'kolkata:salt-lake', '34, Salt Lake', true, '2026-09-20T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:26', 'demo:h06', 'Navrangpura home', 'apartment', 'ahmedabad', 'ahmedabad:navrangpura', '35, Navrangpura', true, '2026-09-21T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:27', 'demo:h07', 'DLF Phase 3 home', 'independent_house', 'gurugram', 'gurugram:dlf', '36, DLF Phase 3', true, '2026-09-22T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:28', 'demo:h08', 'Sector 137 home', 'pg', 'noida', 'noida:sector-137', '37, Sector 137', true, '2026-09-23T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:29', 'demo:h09', 'Sector 17 home', 'coliving', 'chandigarh', 'chandigarh:sector-17', '38, Sector 17', true, '2026-09-24T08:46:12.670Z')
    on conflict (id) do nothing;
insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo, created_at)
    values ('demo:prop:30', 'demo:h10', 'Vaishali Nagar home', 'apartment', 'jaipur', 'jaipur:vaishali', '39, Vaishali Nagar', true, '2026-09-25T08:46:12.670Z')
    on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:01', 'demo:prop:01', 'demo:h01', true, 'Private room in Indiranagar', 'apartment', 'private', '10, Indiranagar',
    'bengaluru', 'bengaluru:indiranagar', '560000', 12.9784, 77.6408, 14000, 14000, '2026-10-21',
    3, null, 'semi', 'any', null, 45, 'any',
    'Open to a compatible flatmate',
    0, 'Private room in a apartment at Indiranagar, Bengaluru. Meera is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    true, true, true, 'active', 'verified', 88, 18, 'featured', true,
    '/rooms/bedroom.jpg', '2026-10-26T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:01', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:01', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:01', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:01', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:01', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:01', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:01', 'lift') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:01', 'parking') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:01', 'food') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:01:ph0', 'demo:lst:01', '/rooms/bedroom.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:01:ph1', 'demo:lst:01', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:01:ph2', 'demo:lst:01', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:02', 'demo:prop:02', 'demo:h02', true, 'Shared room in Bandra', 'apartment', 'shared', '11, Bandra',
    'mumbai', 'mumbai:bandra', '560001', 19.0596, 72.8295, 11000, 22000, '2026-10-22',
    3, null, 'furnished', 'any', null, 45, 'professional',
    'Open to a compatible flatmate',
    1, 'Shared room in a apartment at Bandra, Mumbai. Arjun is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'verified', 89, 55, 'featured', true,
    '/rooms/shared.jpg', '2026-10-23T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:02', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:02', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:02', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:02', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:02', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:02:ph0', 'demo:lst:02', '/rooms/shared.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:02:ph1', 'demo:lst:02', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:02:ph2', 'demo:lst:02', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:03', 'demo:prop:03', 'demo:h03', true, 'Master bedroom in Dwarka', 'independent_house', 'master', '12, Dwarka',
    'delhi-ncr', 'delhi-ncr:dwarka', '560002', 28.5921, 77.046, 16500, 33000, '2026-10-23',
    3, null, 'semi', 'women', 18, 45, 'any',
    'Women flatmates',
    2, 'Master bedroom in a independent house at Dwarka, Delhi NCR. Fatima is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    false, false, false, 'active', 'verified', 90, 92, 'featured', true,
    '/rooms/balcony.jpg', '2026-10-20T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:03', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:03', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:03', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:03', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:03', 'balcony') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:03:ph0', 'demo:lst:03', '/rooms/balcony.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:03:ph1', 'demo:lst:03', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:03:ph2', 'demo:lst:03', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:04', 'demo:prop:04', 'demo:h04', true, 'Studio in Madhapur', 'pg', 'studio', '13, Madhapur',
    'hyderabad', 'hyderabad:madhapur', '560003', 17.4483, 78.3915, 15000, 15000, '2026-10-24',
    3, null, 'unfurnished', 'any', null, 45, 'student',
    'Open to a compatible flatmate',
    3, 'Studio in a pg at Madhapur, Hyderabad. Rohit is looking for a student who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'verified', 91, 129, 'featured', true,
    '/rooms/studio.jpg', '2026-10-17T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:04', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:04', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:04', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:04', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:04', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:04', 'housekeeping') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:04:ph0', 'demo:lst:04', '/rooms/studio.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:04:ph1', 'demo:lst:04', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:04:ph2', 'demo:lst:04', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:04:ph3', 'demo:lst:04', '/rooms/living.jpg', 'Living room', 3) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:05', 'demo:prop:05', 'demo:h05', true, '1 BHK in Hinjewadi', 'coliving', '1bhk', '14, Hinjewadi',
    'pune', 'pune:hinjewadi', '560004', 18.5913, 73.7389, 19500, 39000, '2026-10-25',
    3, null, 'furnished', 'men', 18, 45, 'professional',
    'Men flatmates',
    0, '1 BHK in a coliving at Hinjewadi, Pune. Ananya is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    true, false, false, 'active', 'verified', 92, 166, 'featured', true,
    '/rooms/studio.jpg', '2026-10-14T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:05', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:05', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:05', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:05', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:05', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:05', 'lift') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:05', 'food') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:05:ph0', 'demo:lst:05', '/rooms/studio.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:05:ph1', 'demo:lst:05', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:05:ph2', 'demo:lst:05', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:06', 'demo:prop:06', 'demo:h06', true, 'PG bed in OMR', 'apartment', 'pg_bed', '15, OMR',
    'chennai', 'chennai:omr', '560005', 12.9105, 80.227, 4000, 8000, '2026-10-26',
    1, 12, 'semi', 'any', null, 45, 'any',
    'Open to a compatible flatmate',
    1, 'PG bed in a apartment at OMR, Chennai. Kabir is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'verified', 93, 203, 'featured', true,
    '/rooms/pg.jpg', '2026-10-11T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:06', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:06', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:06', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:06', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:06', 'lift') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:06', 'parking') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:06:ph0', 'demo:lst:06', '/rooms/pg.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:06:ph1', 'demo:lst:06', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:06:ph2', 'demo:lst:06', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:07', 'demo:prop:07', 'demo:h07', true, 'Private room in Salt Lake', 'apartment', 'private', '16, Salt Lake',
    'kolkata', 'kolkata:salt-lake', '560006', 22.5867, 88.4172, 8000, 8000, '2026-10-27',
    3, null, 'furnished', 'women', 18, 45, 'any',
    'Women flatmates',
    2, 'Private room in a apartment at Salt Lake, Kolkata. Divya is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    false, false, false, 'active', 'verified', 94, 240, 'free', false,
    '/rooms/bedroom.jpg', '2026-10-08T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:07', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:07', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:07', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:07', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:07', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:07', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:07', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:07:ph0', 'demo:lst:07', '/rooms/bedroom.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:07:ph1', 'demo:lst:07', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:07:ph2', 'demo:lst:07', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:08', 'demo:prop:08', 'demo:h08', true, '2 BHK in Navrangpura', 'apartment', '2bhk', '17, Navrangpura',
    'ahmedabad', 'ahmedabad:navrangpura', '560007', 23.036, 72.561, 19000, 38000, '2026-10-28',
    3, null, 'semi', 'any', null, 45, 'professional',
    'Open to a compatible flatmate',
    3, '2 BHK in a apartment at Navrangpura, Ahmedabad. Sanjay is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, true, 'active', 'verified', 88, 277, 'free', false,
    '/rooms/living.jpg', '2026-10-05T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:08', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:08', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:08', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:08', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:08', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:08', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:08:ph0', 'demo:lst:08', '/rooms/living.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:08:ph1', 'demo:lst:08', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:08:ph2', 'demo:lst:08', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:08:ph3', 'demo:lst:08', '/rooms/living.jpg', 'Living room', 3) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:09', 'demo:prop:09', 'demo:h09', true, 'Shared room in DLF Phase 3', 'independent_house', 'shared', '18, DLF Phase 3',
    'gurugram', 'gurugram:dlf', '560008', 28.4946, 77.088, 10000, 20000, '2026-10-29',
    3, null, 'unfurnished', 'any', null, 45, 'any',
    'Open to a compatible flatmate',
    0, 'Shared room in a independent house at DLF Phase 3, Gurugram. Lakshmi is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    true, false, false, 'active', 'verified', 81, 314, 'free', false,
    '/rooms/shared.jpg', '2026-10-02T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:09', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:09', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:09', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:09', 'food') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:09:ph0', 'demo:lst:09', '/rooms/shared.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:09:ph1', 'demo:lst:09', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:09:ph2', 'demo:lst:09', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:10', 'demo:prop:10', 'demo:h10', true, '3 BHK in Sector 137', 'pg', '3bhk', '19, Sector 137',
    'noida', 'noida:sector-137', '560009', 28.511, 77.4109, 33500, 33500, '2026-10-30',
    3, null, 'furnished', 'any', null, 45, 'student',
    'Open to a compatible flatmate',
    1, '3 BHK in a pg at Sector 137, Noida. Imran is looking for a student who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'verified', 90, 351, 'premium', false,
    '/rooms/living.jpg', '2026-09-29T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:10', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:10', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:10', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:10', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:10', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:10', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:10', 'housekeeping') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:10:ph0', 'demo:lst:10', '/rooms/living.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:10:ph1', 'demo:lst:10', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:10:ph2', 'demo:lst:10', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:10:ph3', 'demo:lst:10', '/rooms/living.jpg', 'Living room', 3) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:11', 'demo:prop:11', 'demo:h11', true, 'Private room in Sector 17', 'coliving', 'private', '20, Sector 17',
    'chandigarh', 'chandigarh:sector-17', '560010', 30.7398, 76.7827, 9000, 18000, '2026-10-31',
    3, null, 'semi', 'women', 18, 45, 'professional',
    'Women flatmates',
    2, 'Private room in a coliving at Sector 17, Chandigarh. Neha is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    false, false, false, 'active', 'unverified', 73, 388, 'free', false,
    '/rooms/bedroom.jpg', '2026-09-26T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:11', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:11', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:11', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:11', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:11', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:11', 'lift') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:11', 'parking') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:11:ph0', 'demo:lst:11', '/rooms/bedroom.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:11:ph1', 'demo:lst:11', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:11:ph2', 'demo:lst:11', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:12', 'demo:prop:12', 'demo:h12', true, 'Shared room in Vaishali Nagar', 'apartment', 'shared', '21, Vaishali Nagar',
    'jaipur', 'jaipur:vaishali', '560011', 26.911, 75.744, 4500, 9000, '2026-11-01',
    3, null, 'furnished', 'any', null, 45, 'any',
    'Open to a compatible flatmate',
    3, 'Shared room in a apartment at Vaishali Nagar, Jaipur. Vikram is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, true, false, 'active', 'unverified', 74, 425, 'free', false,
    '/rooms/shared.jpg', '2026-09-23T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:12', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:12', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:12', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:12', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:12', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:12:ph0', 'demo:lst:12', '/rooms/shared.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:12:ph1', 'demo:lst:12', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:12:ph2', 'demo:lst:12', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:13', 'demo:prop:13', 'demo:h13', true, 'Master bedroom in Kakkanad', 'apartment', 'master', '22, Kakkanad',
    'kochi', 'kochi:kakkanad', '560012', 10.0159, 76.3419, 11000, 11000, '2026-11-02',
    3, null, 'semi', 'men', 18, 45, 'any',
    'Men flatmates',
    0, 'Master bedroom in a apartment at Kakkanad, Kochi. Pooja is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    true, false, false, 'active', 'pending', 75, 42, 'free', false,
    '/rooms/balcony.jpg', '2026-09-20T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:13', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:13', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:13', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:13', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:13', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:13', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:13', 'lift') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:13', 'food') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:13:ph0', 'demo:lst:13', '/rooms/balcony.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:13:ph1', 'demo:lst:13', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:13:ph2', 'demo:lst:13', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:14', 'demo:prop:14', 'demo:h14', true, 'Studio in Bejai', 'apartment', 'studio', '23, Bejai',
    'mangalore', 'mangalore:bejai', '560013', 12.888, 74.842, 9500, 19000, '2026-11-03',
    3, null, 'unfurnished', 'any', null, 45, 'professional',
    'Open to a compatible flatmate',
    1, 'Studio in a apartment at Bejai, Mangalore. Harish is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'unverified', 76, 79, 'free', false,
    '/rooms/studio.jpg', '2026-09-17T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:14', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:14', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:14', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:14', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:14', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:14:ph0', 'demo:lst:14', '/rooms/studio.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:14:ph1', 'demo:lst:14', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:14:ph2', 'demo:lst:14', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:14:ph3', 'demo:lst:14', '/rooms/living.jpg', 'Living room', 3) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:15', 'demo:prop:15', 'demo:h15', true, '1 BHK in V.V. Mohalla', 'independent_house', '1bhk', '24, V.V. Mohalla',
    'mysuru', 'mysuru:vv-mohalla', '560014', 12.315, 76.625, 10500, 21000, '2026-11-04',
    3, null, 'furnished', 'women', 18, 45, 'any',
    'Women flatmates',
    2, '1 BHK in a independent house at V.V. Mohalla, Mysuru. Aisha is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    false, false, true, 'active', 'unverified', 70, 116, 'free', false,
    '/rooms/studio.jpg', '2026-09-14T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:15', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:15', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:15', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:15', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:15', 'balcony') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:15:ph0', 'demo:lst:15', '/rooms/studio.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:15:ph1', 'demo:lst:15', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:15:ph2', 'demo:lst:15', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:16', 'demo:prop:16', 'demo:h16', true, 'PG bed in Udupi Road', 'pg', 'pg_bed', '25, Udupi Road',
    'manipal', 'manipal:udupi-road', '560015', 13.34, 74.79, 2500, 2500, '2026-11-05',
    1, 12, 'semi', 'any', null, 45, 'student',
    'Open to a compatible flatmate',
    3, 'PG bed in a pg at Udupi Road, Manipal. Nikhil is looking for a student who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'unverified', 71, 153, 'free', false,
    '/rooms/pg.jpg', '2026-09-11T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:16', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:16', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:16', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:16', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:16', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:16', 'parking') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:16', 'housekeeping') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:16:ph0', 'demo:lst:16', '/rooms/pg.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:16:ph1', 'demo:lst:16', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:16:ph2', 'demo:lst:16', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:17', 'demo:prop:17', 'demo:h17', true, 'Private room in Kunjibettu', 'coliving', 'private', '26, Kunjibettu',
    'udupi', 'udupi:kunjibettu', '560016', 13.34, 74.75, 5000, 10000, '2026-11-06',
    3, null, 'furnished', 'any', null, 45, 'professional',
    'Open to a compatible flatmate',
    0, 'Private room in a coliving at Kunjibettu, Udupi. Sneha is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    true, false, false, 'active', 'unverified', 72, 190, 'free', false,
    '/rooms/bedroom.jpg', '2026-09-08T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:17', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:17', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:17', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:17', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:17', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:17', 'lift') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:17', 'food') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:17:ph0', 'demo:lst:17', '/rooms/bedroom.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:17:ph1', 'demo:lst:17', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:17:ph2', 'demo:lst:17', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:18', 'demo:prop:18', 'demo:h18', true, '2 BHK in Gandhipuram', 'apartment', '2bhk', '27, Gandhipuram',
    'coimbatore', 'coimbatore:gandhipuram', '560017', 11.018, 76.967, 16500, 33000, '2026-11-07',
    3, null, 'semi', 'any', null, 45, 'any',
    'Open to a compatible flatmate',
    1, '2 BHK in a apartment at Gandhipuram, Coimbatore. Joseph is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'unverified', 73, 227, 'free', false,
    '/rooms/living.jpg', '2026-09-05T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:18', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:18', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:18', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:18', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:18', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:18', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:18:ph0', 'demo:lst:18', '/rooms/living.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:18:ph1', 'demo:lst:18', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:18:ph2', 'demo:lst:18', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:18:ph3', 'demo:lst:18', '/rooms/living.jpg', 'Living room', 3) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:19', 'demo:prop:19', 'demo:h19', true, 'Shared room in Jayanagar', 'apartment', 'shared', '28, Jayanagar',
    'bengaluru', 'bengaluru:jayanagar', '560018', 12.9308, 77.5838, 8500, 8500, '2026-11-08',
    3, null, 'unfurnished', 'women', 18, 45, 'any',
    'Women flatmates',
    2, 'Shared room in a apartment at Jayanagar, Bengaluru. Ritika is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    false, false, false, 'active', 'pending', 74, 264, 'premium', false,
    '/rooms/shared.jpg', '2026-09-02T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:19', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:19', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:19', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:19', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:19', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:19:ph0', 'demo:lst:19', '/rooms/shared.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:19:ph1', 'demo:lst:19', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:19:ph2', 'demo:lst:19', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:20', 'demo:prop:20', 'demo:h20', true, '3 BHK in Dadar', 'apartment', '3bhk', '29, Dadar',
    'mumbai', 'mumbai:dadar', '560019', 19.0178, 72.8478, 55000, 110000, '2026-11-09',
    3, null, 'furnished', 'any', null, 45, 'professional',
    'Open to a compatible flatmate',
    3, '3 BHK in a apartment at Dadar, Mumbai. Aditya is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'unverified', 75, 301, 'free', false,
    '/rooms/living.jpg', '2026-08-30T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:20', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:20', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:20', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:20', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:20', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:20', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:20:ph0', 'demo:lst:20', '/rooms/living.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:20:ph1', 'demo:lst:20', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:20:ph2', 'demo:lst:20', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:20:ph3', 'demo:lst:20', '/rooms/living.jpg', 'Living room', 3) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:21', 'demo:prop:21', 'demo:h01', true, 'Private room in Saket', 'independent_house', 'private', '30, Saket',
    'delhi-ncr', 'delhi-ncr:saket', '560020', 28.5245, 77.2066, 13000, 26000, '2026-11-10',
    3, null, 'semi', 'men', 18, 45, 'any',
    'Men flatmates',
    0, 'Private room in a independent house at Saket, Delhi NCR. Meera is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    true, false, false, 'active', 'verified', 94, 338, 'free', false,
    '/rooms/bedroom.jpg', '2026-08-27T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:21', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:21', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:21', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:21', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:21', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:21', 'parking') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:21', 'food') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:21:ph0', 'demo:lst:21', '/rooms/bedroom.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:21:ph1', 'demo:lst:21', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:21:ph2', 'demo:lst:21', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:22', 'demo:prop:22', 'demo:h02', true, 'Shared room in Madhapur', 'pg', 'shared', '31, Madhapur',
    'hyderabad', 'hyderabad:madhapur', '560021', 17.4483, 78.3915, 6500, 6500, '2026-11-11',
    3, null, 'furnished', 'any', null, 45, 'student',
    'Open to a compatible flatmate',
    1, 'Shared room in a pg at Madhapur, Hyderabad. Arjun is looking for a student who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, true, 'active', 'verified', 88, 375, 'free', false,
    '/rooms/shared.jpg', '2026-08-24T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:22', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:22', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:22', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:22', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:22', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:22', 'housekeeping') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:22:ph0', 'demo:lst:22', '/rooms/shared.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:22:ph1', 'demo:lst:22', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:22:ph2', 'demo:lst:22', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:23', 'demo:prop:23', 'demo:h03', true, 'Master bedroom in Hinjewadi', 'coliving', 'master', '32, Hinjewadi',
    'pune', 'pune:hinjewadi', '560022', 18.5913, 73.7389, 14000, 28000, '2026-11-12',
    3, null, 'semi', 'women', 18, 45, 'professional',
    'Women flatmates',
    2, 'Master bedroom in a coliving at Hinjewadi, Pune. Fatima is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    false, true, false, 'active', 'verified', 89, 412, 'free', false,
    '/rooms/balcony.jpg', '2026-08-21T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:23', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:23', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:23', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:23', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:23', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:23', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:23:ph0', 'demo:lst:23', '/rooms/balcony.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:23:ph1', 'demo:lst:23', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:23:ph2', 'demo:lst:23', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:24', 'demo:prop:24', 'demo:h04', true, 'Studio in OMR', 'apartment', 'studio', '33, OMR',
    'chennai', 'chennai:omr', '560023', 12.9105, 80.227, 14500, 29000, '2026-11-13',
    3, null, 'unfurnished', 'any', null, 45, 'any',
    'Open to a compatible flatmate',
    3, 'Studio in a apartment at OMR, Chennai. Rohit is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'verified', 90, 29, 'free', false,
    '/rooms/studio.jpg', '2026-08-18T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:24', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:24', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:24', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:24', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:24', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:24:ph0', 'demo:lst:24', '/rooms/studio.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:24:ph1', 'demo:lst:24', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:24:ph2', 'demo:lst:24', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:24:ph3', 'demo:lst:24', '/rooms/living.jpg', 'Living room', 3) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:25', 'demo:prop:25', 'demo:h05', true, '1 BHK in Salt Lake', 'apartment', '1bhk', '34, Salt Lake',
    'kolkata', 'kolkata:salt-lake', '560024', 22.5867, 88.4172, 14000, 14000, '2026-11-14',
    3, null, 'furnished', 'any', null, 45, 'any',
    'Open to a compatible flatmate',
    0, '1 BHK in a apartment at Salt Lake, Kolkata. Ananya is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    true, false, false, 'active', 'verified', 91, 66, 'free', false,
    '/rooms/studio.jpg', '2026-08-15T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:25', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:25', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:25', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:25', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:25', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:25', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:25', 'lift') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:25', 'food') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:25:ph0', 'demo:lst:25', '/rooms/studio.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:25:ph1', 'demo:lst:25', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:25:ph2', 'demo:lst:25', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:26', 'demo:prop:26', 'demo:h06', true, 'PG bed in Navrangpura', 'apartment', 'pg_bed', '35, Navrangpura',
    'ahmedabad', 'ahmedabad:navrangpura', '560025', 23.036, 72.561, 3500, 7000, '2026-11-15',
    1, 12, 'semi', 'any', null, 45, 'professional',
    'Open to a compatible flatmate',
    1, 'PG bed in a apartment at Navrangpura, Ahmedabad. Kabir is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'verified', 92, 103, 'free', false,
    '/rooms/pg.jpg', '2026-08-12T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:26', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:26', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:26', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:26', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:26', 'lift') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:26', 'parking') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:26:ph0', 'demo:lst:26', '/rooms/pg.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:26:ph1', 'demo:lst:26', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:26:ph2', 'demo:lst:26', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:27', 'demo:prop:27', 'demo:h07', true, 'Private room in DLF Phase 3', 'independent_house', 'private', '36, DLF Phase 3',
    'gurugram', 'gurugram:dlf', '560026', 28.4946, 77.088, 16000, 32000, '2026-11-16',
    3, null, 'furnished', 'women', 18, 45, 'any',
    'Women flatmates',
    2, 'Private room in a independent house at DLF Phase 3, Gurugram. Divya is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    false, false, false, 'active', 'verified', 93, 140, 'free', false,
    '/rooms/bedroom.jpg', '2026-08-09T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:27', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:27', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:27', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:27', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:27', 'balcony') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:27:ph0', 'demo:lst:27', '/rooms/bedroom.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:27:ph1', 'demo:lst:27', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:27:ph2', 'demo:lst:27', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:28', 'demo:prop:28', 'demo:h08', true, '2 BHK in Sector 137', 'pg', '2bhk', '37, Sector 137',
    'noida', 'noida:sector-137', '560027', 28.511, 77.4109, 26000, 26000, '2026-11-17',
    3, null, 'semi', 'any', null, 45, 'student',
    'Open to a compatible flatmate',
    3, '2 BHK in a pg at Sector 137, Noida. Sanjay is looking for a student who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'verified', 94, 177, 'premium', false,
    '/rooms/living.jpg', '2026-10-25T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:28', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:28', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:28', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:28', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:28', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:28', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:28', 'housekeeping') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:28:ph0', 'demo:lst:28', '/rooms/living.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:28:ph1', 'demo:lst:28', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:28:ph2', 'demo:lst:28', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:28:ph3', 'demo:lst:28', '/rooms/living.jpg', 'Living room', 3) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:29', 'demo:prop:29', 'demo:h09', true, 'Shared room in Sector 17', 'coliving', 'shared', '38, Sector 17',
    'chandigarh', 'chandigarh:sector-17', '560028', 30.7398, 76.7827, 5500, 11000, '2026-11-18',
    3, null, 'unfurnished', 'men', 18, 45, 'professional',
    'Men flatmates',
    0, 'Shared room in a coliving at Sector 17, Chandigarh. Lakshmi is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    true, false, true, 'active', 'verified', 88, 214, 'free', false,
    '/rooms/shared.jpg', '2026-10-22T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:29', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:29', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:29', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:29', 'lift') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:29', 'food') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:29:ph0', 'demo:lst:29', '/rooms/shared.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:29:ph1', 'demo:lst:29', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:29:ph2', 'demo:lst:29', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:30', 'demo:prop:30', 'demo:h10', true, '3 BHK in Vaishali Nagar', 'apartment', '3bhk', '39, Vaishali Nagar',
    'jaipur', 'jaipur:vaishali', '560029', 26.911, 75.744, 23000, 46000, '2026-11-19',
    3, null, 'furnished', 'any', null, 45, 'any',
    'Open to a compatible flatmate',
    1, '3 BHK in a apartment at Vaishali Nagar, Jaipur. Imran is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'verified', 89, 251, 'free', false,
    '/rooms/living.jpg', '2026-10-19T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:30', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:30', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:30', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:30', 'attached_bath') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:30', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:30', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:30:ph0', 'demo:lst:30', '/rooms/living.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:30:ph1', 'demo:lst:30', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:30:ph2', 'demo:lst:30', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:30:ph3', 'demo:lst:30', '/rooms/living.jpg', 'Living room', 3) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:31', 'demo:prop:01', 'demo:h01', true, 'Shared room in Indiranagar', 'apartment', 'shared', '10, Indiranagar',
    'bengaluru', 'bengaluru:indiranagar', '560030', 12.9784, 77.6408, 8500, 8500, '2026-11-20',
    3, null, 'semi', 'women', 18, 45, 'any',
    'Women flatmates',
    2, 'Shared room in a apartment at Indiranagar, Bengaluru. Meera is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    false, false, false, 'active', 'verified', 90, 288, 'free', false,
    '/rooms/shared.jpg', '2026-10-16T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:31', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:31', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:31', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:31', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:31', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:31', 'lift') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:31', 'parking') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:31:ph0', 'demo:lst:31', '/rooms/shared.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:31:ph1', 'demo:lst:31', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:31:ph2', 'demo:lst:31', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:32', 'demo:prop:02', 'demo:h02', true, 'PG bed in Bandra', 'apartment', 'pg_bed', '11, Bandra',
    'mumbai', 'mumbai:bandra', '560031', 19.0596, 72.8295, 7500, 15000, '2026-11-21',
    1, 12, 'furnished', 'any', null, 45, 'professional',
    'Open to a compatible flatmate',
    3, 'PG bed in a apartment at Bandra, Mumbai. Arjun is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'verified', 91, 325, 'free', false,
    '/rooms/pg.jpg', '2026-10-13T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:32', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:32', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:32', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:32', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:32', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:32:ph0', 'demo:lst:32', '/rooms/pg.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:32:ph1', 'demo:lst:32', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:32:ph2', 'demo:lst:32', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:33', 'demo:prop:03', 'demo:h03', true, 'Shared room in Dwarka', 'independent_house', 'shared', '12, Dwarka',
    'delhi-ncr', 'delhi-ncr:dwarka', '560032', 28.5921, 77.046, 8000, 16000, '2026-11-22',
    3, null, 'semi', 'any', null, 45, 'any',
    'Open to a compatible flatmate',
    0, 'Shared room in a independent house at Dwarka, Delhi NCR. Fatima is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    true, false, false, 'active', 'verified', 92, 362, 'free', false,
    '/rooms/shared.jpg', '2026-10-10T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:33', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:33', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:33', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:33', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:33', 'food') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:33:ph0', 'demo:lst:33', '/rooms/shared.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:33:ph1', 'demo:lst:33', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:33:ph2', 'demo:lst:33', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:34', 'demo:prop:04', 'demo:h04', true, 'PG bed in Madhapur', 'pg', 'pg_bed', '13, Madhapur',
    'hyderabad', 'hyderabad:madhapur', '560033', 17.4483, 78.3915, 4500, 4500, '2026-11-23',
    1, 12, 'unfurnished', 'any', null, 45, 'student',
    'Open to a compatible flatmate',
    1, 'PG bed in a pg at Madhapur, Hyderabad. Rohit is looking for a student who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, true, false, 'active', 'verified', 93, 399, 'free', false,
    '/rooms/pg.jpg', '2026-10-07T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:34', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:34', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:34', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:34', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:34', 'housekeeping') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:34:ph0', 'demo:lst:34', '/rooms/pg.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:34:ph1', 'demo:lst:34', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:34:ph2', 'demo:lst:34', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:35', 'demo:prop:05', 'demo:h05', true, 'Shared room in Hinjewadi', 'coliving', 'shared', '14, Hinjewadi',
    'pune', 'pune:hinjewadi', '560034', 18.5913, 73.7389, 7000, 14000, '2026-11-24',
    3, null, 'furnished', 'women', 18, 45, 'professional',
    'Women flatmates',
    2, 'Shared room in a coliving at Hinjewadi, Pune. Ananya is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    false, false, false, 'active', 'verified', 94, 436, 'free', false,
    '/rooms/shared.jpg', '2026-10-04T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:35', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:35', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:35', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:35', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:35', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:35:ph0', 'demo:lst:35', '/rooms/shared.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:35:ph1', 'demo:lst:35', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:35:ph2', 'demo:lst:35', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:36', 'demo:prop:06', 'demo:h06', true, 'PG bed in OMR', 'apartment', 'pg_bed', '15, OMR',
    'chennai', 'chennai:omr', '560035', 12.9105, 80.227, 4000, 8000, '2026-11-25',
    1, 12, 'semi', 'any', null, 45, 'any',
    'Open to a compatible flatmate',
    3, 'PG bed in a apartment at OMR, Chennai. Kabir is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, true, 'active', 'verified', 88, 53, 'free', false,
    '/rooms/pg.jpg', '2026-10-01T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:36', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:36', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:36', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:36', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:36', 'lift') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:36', 'parking') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:36:ph0', 'demo:lst:36', '/rooms/pg.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:36:ph1', 'demo:lst:36', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:36:ph2', 'demo:lst:36', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:37', 'demo:prop:07', 'demo:h07', true, 'Shared room in Salt Lake', 'apartment', 'shared', '16, Salt Lake',
    'kolkata', 'kolkata:salt-lake', '560036', 22.5867, 88.4172, 5000, 5000, '2026-11-26',
    3, null, 'furnished', 'men', 18, 45, 'any',
    'Men flatmates',
    0, 'Shared room in a apartment at Salt Lake, Kolkata. Divya is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    true, false, false, 'active', 'verified', 89, 90, 'premium', false,
    '/rooms/shared.jpg', '2026-09-28T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:37', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:37', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:37', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:37', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:37', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:37', 'lift') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:37', 'food') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:37:ph0', 'demo:lst:37', '/rooms/shared.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:37:ph1', 'demo:lst:37', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:37:ph2', 'demo:lst:37', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:38', 'demo:prop:08', 'demo:h08', true, 'PG bed in Navrangpura', 'apartment', 'pg_bed', '17, Navrangpura',
    'ahmedabad', 'ahmedabad:navrangpura', '560037', 23.036, 72.561, 3500, 7000, '2026-11-27',
    1, 12, 'semi', 'any', null, 45, 'professional',
    'Open to a compatible flatmate',
    1, 'PG bed in a apartment at Navrangpura, Ahmedabad. Sanjay is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'verified', 90, 127, 'free', false,
    '/rooms/pg.jpg', '2026-09-25T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:38', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:38', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:38', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:38', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:38', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:38:ph0', 'demo:lst:38', '/rooms/pg.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:38:ph1', 'demo:lst:38', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:38:ph2', 'demo:lst:38', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:39', 'demo:prop:09', 'demo:h09', true, 'Shared room in DLF Phase 3', 'independent_house', 'shared', '18, DLF Phase 3',
    'gurugram', 'gurugram:dlf', '560038', 28.4946, 77.088, 10000, 20000, '2026-11-28',
    3, null, 'unfurnished', 'women', 18, 45, 'any',
    'Women flatmates',
    2, 'Shared room in a independent house at DLF Phase 3, Gurugram. Lakshmi is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    false, false, false, 'active', 'verified', 83, 164, 'free', false,
    '/rooms/shared.jpg', '2026-09-22T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:39', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:39', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:39', 'balcony') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:39:ph0', 'demo:lst:39', '/rooms/shared.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:39:ph1', 'demo:lst:39', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:39:ph2', 'demo:lst:39', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:40', 'demo:prop:10', 'demo:h10', true, 'PG bed in Sector 137', 'pg', 'pg_bed', '19, Sector 137',
    'noida', 'noida:sector-137', '560039', 28.511, 77.4109, 4500, 4500, '2026-11-29',
    1, 12, 'furnished', 'any', null, 45, 'student',
    'Open to a compatible flatmate',
    3, 'PG bed in a pg at Sector 137, Noida. Imran is looking for a student who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'verified', 92, 201, 'free', false,
    '/rooms/pg.jpg', '2026-09-19T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:40', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:40', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:40', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:40', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:40', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:40', 'housekeeping') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:40:ph0', 'demo:lst:40', '/rooms/pg.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:40:ph1', 'demo:lst:40', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:40:ph2', 'demo:lst:40', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:41', 'demo:prop:11', 'demo:h11', true, 'Shared room in Sector 17', 'coliving', 'shared', '20, Sector 17',
    'chandigarh', 'chandigarh:sector-17', '560040', 30.7398, 76.7827, 5500, 11000, '2026-10-21',
    3, null, 'semi', 'any', null, 45, 'professional',
    'Open to a compatible flatmate',
    0, 'Shared room in a coliving at Sector 17, Chandigarh. Neha is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    true, false, false, 'active', 'unverified', 75, 238, 'free', false,
    '/rooms/shared.jpg', '2026-09-16T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:41', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:41', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:41', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:41', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:41', 'lift') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:41', 'parking') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:41', 'food') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:41:ph0', 'demo:lst:41', '/rooms/shared.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:41:ph1', 'demo:lst:41', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:41:ph2', 'demo:lst:41', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:42', 'demo:prop:12', 'demo:h12', true, 'PG bed in Vaishali Nagar', 'apartment', 'pg_bed', '21, Vaishali Nagar',
    'jaipur', 'jaipur:vaishali', '560041', 26.911, 75.744, 3000, 6000, '2026-10-22',
    1, 12, 'furnished', 'any', null, 45, 'any',
    'Open to a compatible flatmate',
    1, 'PG bed in a apartment at Vaishali Nagar, Jaipur. Vikram is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'unverified', 76, 275, 'free', false,
    '/rooms/pg.jpg', '2026-09-13T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:42', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:42', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:42', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:42', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:42', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:42:ph0', 'demo:lst:42', '/rooms/pg.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:42:ph1', 'demo:lst:42', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:42:ph2', 'demo:lst:42', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:43', 'demo:prop:13', 'demo:h13', true, 'Shared room in Kakkanad', 'apartment', 'shared', '22, Kakkanad',
    'kochi', 'kochi:kakkanad', '560042', 10.0159, 76.3419, 5500, 5500, '2026-10-23',
    3, null, 'semi', 'women', 18, 45, 'any',
    'Women flatmates',
    2, 'Shared room in a apartment at Kakkanad, Kochi. Pooja is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    false, false, true, 'active', 'pending', 70, 312, 'free', false,
    '/rooms/shared.jpg', '2026-09-10T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:43', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:43', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:43', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:43', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:43', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:43', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:43:ph0', 'demo:lst:43', '/rooms/shared.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:43:ph1', 'demo:lst:43', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:43:ph2', 'demo:lst:43', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:44', 'demo:prop:14', 'demo:h14', true, 'PG bed in Bejai', 'apartment', 'pg_bed', '23, Bejai',
    'mangalore', 'mangalore:bejai', '560043', 12.888, 74.842, 2500, 5000, '2026-10-24',
    1, 12, 'unfurnished', 'any', null, 45, 'professional',
    'Open to a compatible flatmate',
    3, 'PG bed in a apartment at Bejai, Mangalore. Harish is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'unverified', 63, 349, 'free', false,
    '/rooms/pg.jpg', '2026-09-07T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:44', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:44', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:44', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:44', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:44:ph0', 'demo:lst:44', '/rooms/pg.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:44:ph1', 'demo:lst:44', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:44:ph2', 'demo:lst:44', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:45', 'demo:prop:15', 'demo:h15', true, 'Shared room in V.V. Mohalla', 'independent_house', 'shared', '24, V.V. Mohalla',
    'mysuru', 'mysuru:vv-mohalla', '560044', 12.315, 76.625, 3500, 7000, '2026-10-25',
    3, null, 'furnished', 'men', 18, 45, 'any',
    'Men flatmates',
    0, 'Shared room in a independent house at V.V. Mohalla, Mysuru. Aisha is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    true, true, false, 'active', 'unverified', 72, 386, 'free', false,
    '/rooms/shared.jpg', '2026-09-04T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:45', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:45', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:45', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:45', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:45', 'food') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:45:ph0', 'demo:lst:45', '/rooms/shared.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:45:ph1', 'demo:lst:45', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:45:ph2', 'demo:lst:45', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:46', 'demo:prop:16', 'demo:h16', true, 'PG bed in Udupi Road', 'pg', 'pg_bed', '25, Udupi Road',
    'manipal', 'manipal:udupi-road', '560045', 13.34, 74.79, 2500, 2500, '2026-10-26',
    1, 12, 'semi', 'any', null, 45, 'student',
    'Open to a compatible flatmate',
    1, 'PG bed in a pg at Udupi Road, Manipal. Nikhil is looking for a student who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'unverified', 73, 423, 'premium', false,
    '/rooms/pg.jpg', '2026-09-01T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:46', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:46', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:46', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:46', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:46', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:46', 'parking') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:46', 'housekeeping') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:46:ph0', 'demo:lst:46', '/rooms/pg.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:46:ph1', 'demo:lst:46', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:46:ph2', 'demo:lst:46', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:47', 'demo:prop:17', 'demo:h17', true, 'Shared room in Kunjibettu', 'coliving', 'shared', '26, Kunjibettu',
    'udupi', 'udupi:kunjibettu', '560046', 13.34, 74.75, 3000, 6000, '2026-10-27',
    3, null, 'furnished', 'women', 18, 45, 'professional',
    'Women flatmates',
    2, 'Shared room in a coliving at Kunjibettu, Udupi. Sneha is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    false, false, false, 'active', 'unverified', 74, 40, 'free', false,
    '/rooms/shared.jpg', '2026-08-29T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:47', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:47', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:47', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:47', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:47', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:47:ph0', 'demo:lst:47', '/rooms/shared.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:47:ph1', 'demo:lst:47', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:47:ph2', 'demo:lst:47', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:48', 'demo:prop:18', 'demo:h18', true, 'PG bed in Gandhipuram', 'apartment', 'pg_bed', '27, Gandhipuram',
    'coimbatore', 'coimbatore:gandhipuram', '560047', 11.018, 76.967, 3000, 6000, '2026-10-28',
    1, 12, 'semi', 'any', null, 45, 'any',
    'Open to a compatible flatmate',
    3, 'PG bed in a apartment at Gandhipuram, Coimbatore. Joseph is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, false, 'active', 'unverified', 75, 77, 'free', false,
    '/rooms/pg.jpg', '2026-08-26T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:48', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:48', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:48', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:48', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:48', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:48:ph0', 'demo:lst:48', '/rooms/pg.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:48:ph1', 'demo:lst:48', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:48:ph2', 'demo:lst:48', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:49', 'demo:prop:19', 'demo:h19', true, 'Shared room in Jayanagar', 'apartment', 'shared', '28, Jayanagar',
    'bengaluru', 'bengaluru:jayanagar', '560048', 12.9308, 77.5838, 8500, 8500, '2026-10-29',
    3, null, 'unfurnished', 'any', null, 45, 'any',
    'Open to a compatible flatmate',
    0, 'Shared room in a apartment at Jayanagar, Bengaluru. Ritika is looking for a flatmate who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'Occasional guests with a day''s notice',
    true, false, false, 'paused', 'pending', 76, 114, 'free', false,
    '/rooms/shared.jpg', '2026-08-23T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:49', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:49', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:49', 'balcony') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:49', 'ac') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:49', 'lift') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:49', 'food') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:49:ph0', 'demo:lst:49', '/rooms/shared.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:49:ph1', 'demo:lst:49', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:49:ph2', 'demo:lst:49', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into listings (
    id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
    lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
    age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
    food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, views, plan, featured,
    cover_image, created_at
  ) values (
    'demo:lst:50', 'demo:prop:20', 'demo:h20', true, 'PG bed in Dadar', 'apartment', 'pg_bed', '29, Dadar',
    'mumbai', 'mumbai:dadar', '560049', 19.0178, 72.8478, 7500, 15000, '2026-10-30',
    1, 12, 'furnished', 'any', null, 45, 'professional',
    'Open to a compatible flatmate',
    1, 'PG bed in a apartment at Dadar, Mumbai. Aditya is looking for a working professional who is tidy and direct. Demo listing — not a live vacancy.', 'No parties. Quiet after 10:30 pm. Shared cleaning rota on Sundays.',
    'No overnight guests',
    false, false, true, 'occupied', 'unverified', 70, 151, 'free', false,
    '/rooms/pg.jpg', '2026-08-20T08:46:12.670Z'
  ) on conflict (id) do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:50', 'wifi') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:50', 'kitchen') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:50', 'washing') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:50', 'backup') on conflict do nothing;
insert into listing_amenities (listing_id, amenity_id) values ('demo:lst:50', 'lift') on conflict do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:50:ph0', 'demo:lst:50', '/rooms/pg.jpg', 'Bedroom', 0) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:50:ph1', 'demo:lst:50', '/rooms/kitchen.jpg', 'Kitchen', 1) on conflict (id) do nothing;
insert into listing_photos (id, listing_id, url, category, sort_order) values ('demo:lst:50:ph2', 'demo:lst:50', '/rooms/exterior.jpg', 'Building exterior', 2) on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:01', 'demo:s01', true, 'Aman Gupta', 27, 'man', 'Software engineer', 'bengaluru', 'Indiranagar, Koramangala', 15500, '2026-11-05', 3, 'private', 'semi', 'yes', 'no', 'yes', 'any', 1, '27-year-old software engineer relocating to Bengaluru. Budget 15,500 rupees. Looking for a private room near Indiranagar. Move-in 2026-11-05. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-06T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:02', 'demo:s02', true, 'Sana Merchant', 22, 'woman', 'Intern', 'delhi-ncr', 'Saket, Hauz Khas', 9000, '2026-11-06', 4, 'shared', 'furnished', 'either', 'no', 'no', 'women', 1, '22-year-old intern relocating to Delhi NCR. Budget 9,000 rupees. Looking for a shared room near Saket. Move-in 2026-11-06. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-07T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:03', 'demo:s03', true, 'Rahul Das', 21, 'man', 'Student', 'pune', 'Kothrud, Hinjewadi', 12000, '2026-11-07', 5, 'master', 'semi', 'either', 'no', 'no', 'any', 1, '21-year-old student relocating to Pune. Budget 12,000 rupees. Looking for a master bedroom near Kothrud. Move-in 2026-11-07. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-08T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:04', 'demo:s04', true, 'Priya Krishnan', 26, 'woman', 'Designer', 'kolkata', 'Salt Lake, Ballygunge', 5500, '2026-11-08', 6, 'studio', 'unfurnished', 'yes', 'no', 'no', 'women', 1, '26-year-old designer relocating to Kolkata. Budget 5,500 rupees. Looking for a studio near Salt Lake. Move-in 2026-11-08. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-09T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:05', 'demo:s05', true, 'Mohammed Irfan', 24, 'man', 'Analyst', 'gurugram', 'DLF Phase 3, Sector 56', 17500, '2026-11-09', 7, 'pg_bed', 'furnished', 'either', 'no', 'no', 'any', 1, '24-year-old analyst relocating to Gurugram. Budget 17,500 rupees. Looking for a pg bed near DLF Phase 3. Move-in 2026-11-09. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-10T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:06', 'demo:s06', true, 'Tara D''Souza', 28, 'woman', 'Nurse', 'chandigarh', 'Sector 17, Sector 22', 6500, '2026-11-10', 8, 'private', 'semi', 'either', 'no', 'yes', 'women', 1, '28-year-old nurse relocating to Chandigarh. Budget 6,500 rupees. Looking for a private room near Sector 17. Move-in 2026-11-10. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-11T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:07', 'demo:s07', true, 'Karan Malhotra', 23, 'man', 'New joiner', 'kochi', 'Kakkanad, Panampilly Nagar', 9500, '2026-11-11', 9, 'shared', 'furnished', 'yes', 'no', 'no', 'any', 1, '23-year-old new joiner relocating to Kochi. Budget 9,500 rupees. Looking for a shared room near Kakkanad. Move-in 2026-11-11. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-12T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:08', 'demo:s08', true, 'Ishita Bose', 25, 'woman', 'Researcher', 'mysuru', 'V.V. Mohalla, Gokulam', 4000, '2026-11-12', 10, 'master', 'semi', 'either', 'no', 'no', 'women', 1, '25-year-old researcher relocating to Mysuru. Budget 4,000 rupees. Looking for a master bedroom near V.V. Mohalla. Move-in 2026-11-12. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-13T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:09', 'demo:s09', true, 'Deepak Yadav', 30, 'man', 'Sales', 'udupi', 'Kunjibettu, Malpe Road', 5500, '2026-11-13', 11, 'studio', 'unfurnished', 'either', 'no', 'no', 'any', 1, '30-year-old sales relocating to Udupi. Budget 5,500 rupees. Looking for a studio near Kunjibettu. Move-in 2026-11-13. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-14T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:10', 'demo:s10', true, 'Nandini Pai', 20, 'woman', 'Student', 'bengaluru', 'Indiranagar, Koramangala', 10000, '2026-11-14', 12, 'pg_bed', 'furnished', 'yes', 'no', 'no', 'women', 1, '20-year-old student relocating to Bengaluru. Budget 10,000 rupees. Looking for a pg bed near Indiranagar. Move-in 2026-11-14. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-15T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:11', 'demo:s11', true, 'Varun Khanna', 29, 'man', 'Software engineer', 'delhi-ncr', 'Saket, Hauz Khas', 14500, '2026-11-15', 3, 'private', 'semi', 'either', 'no', 'yes', 'any', 1, '29-year-old software engineer relocating to Delhi NCR. Budget 14,500 rupees. Looking for a private room near Saket. Move-in 2026-11-15. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-16T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:12', 'demo:s12', true, 'Leela Thomas', 31, 'woman', 'Teacher', 'pune', 'Kothrud, Hinjewadi', 7500, '2026-11-16', 4, 'shared', 'furnished', 'either', 'no', 'no', 'women', 1, '31-year-old teacher relocating to Pune. Budget 7,500 rupees. Looking for a shared room near Kothrud. Move-in 2026-11-16. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-17T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:13', 'demo:s13', true, 'Farhan Ali', 23, 'man', 'Intern', 'kolkata', 'Salt Lake, Ballygunge', 9000, '2026-11-17', 5, 'master', 'semi', 'yes', 'no', 'no', 'any', 1, '23-year-old intern relocating to Kolkata. Budget 9,000 rupees. Looking for a master bedroom near Salt Lake. Move-in 2026-11-17. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-18T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:14', 'demo:s14', true, 'Shreya Kamat', 27, 'woman', 'Product designer', 'gurugram', 'DLF Phase 3, Sector 56', 11000, '2026-11-18', 6, 'studio', 'unfurnished', 'either', 'no', 'no', 'women', 1, '27-year-old product designer relocating to Gurugram. Budget 11,000 rupees. Looking for a studio near DLF Phase 3. Move-in 2026-11-18. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-19T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:15', 'demo:s15', true, 'Abhishek Rao', 22, 'man', 'Student', 'chandigarh', 'Sector 17, Sector 22', 10000, '2026-11-19', 7, 'pg_bed', 'furnished', 'either', 'no', 'no', 'any', 1, '22-year-old student relocating to Chandigarh. Budget 10,000 rupees. Looking for a pg bed near Sector 17. Move-in 2026-11-19. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-20T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:16', 'demo:s16', true, 'Maya Pillai', 32, 'woman', 'Doctor', 'kochi', 'Kakkanad, Panampilly Nagar', 6000, '2026-11-20', 8, 'private', 'semi', 'yes', 'no', 'yes', 'women', 1, '32-year-old doctor relocating to Kochi. Budget 6,000 rupees. Looking for a private room near Kakkanad. Move-in 2026-11-20. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-06T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:17', 'demo:s17', true, 'Suresh Babu', 34, 'man', 'Technician', 'mysuru', 'V.V. Mohalla, Gokulam', 6500, '2026-11-21', 9, 'shared', 'furnished', 'either', 'no', 'no', 'any', 1, '34-year-old technician relocating to Mysuru. Budget 6,500 rupees. Looking for a shared room near V.V. Mohalla. Move-in 2026-11-21. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-07T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:18', 'demo:s18', true, 'Anjali Mehta', 24, 'woman', 'Analyst', 'udupi', 'Kunjibettu, Malpe Road', 3500, '2026-11-22', 10, 'master', 'semi', 'either', 'no', 'no', 'women', 1, '24-year-old analyst relocating to Udupi. Budget 3,500 rupees. Looking for a master bedroom near Kunjibettu. Move-in 2026-11-22. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-08T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:19', 'demo:s19', true, 'Omar Siddiqui', 21, 'man', 'Student', 'bengaluru', 'Indiranagar, Koramangala', 15500, '2026-11-23', 11, 'studio', 'unfurnished', 'yes', 'no', 'no', 'any', 1, '21-year-old student relocating to Bengaluru. Budget 15,500 rupees. Looking for a studio near Indiranagar. Move-in 2026-11-23. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-09T08:46:12.670Z')
    on conflict (id) do nothing;
insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle, created_at)
    values ('demo:want:20', 'demo:s20', true, 'Kavya Hegde', 22, 'woman', 'Intern', 'delhi-ncr', 'Saket, Hauz Khas', 9000, '2026-11-24', 12, 'pg_bed', 'furnished', 'either', 'no', 'no', 'women', 1, '22-year-old intern relocating to Delhi NCR. Budget 9,000 rupees. Looking for a pg bed near Saket. Move-in 2026-11-24. Demo request.', 'Early mornings, cooks a few nights a week, prefers a quiet flat.', '2026-10-10T08:46:12.670Z')
    on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:01', 'demo:lst:01', '2026-10-11T08:46:12.670Z', '2026-10-26T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:01', 'demo:s01', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:01', 'demo:h01', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:01', 'demo:conv:01', 'demo:s01', 'Is this room still free next month?', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:02', 'demo:conv:01', 'demo:h01', 'Yes. It is a demo listing, so visits are not scheduled, but the enquiry thread works.', '2026-10-19T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:03', 'demo:conv:01', 'demo:s01', 'Thanks, I will keep this in my saved list.', '2026-10-20T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:02', 'demo:lst:02', '2026-10-12T08:46:12.670Z', '2026-10-25T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:02', 'demo:s02', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:02', 'demo:h02', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:04', 'demo:conv:02', 'demo:s02', 'What is included in the rent?', '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:05', 'demo:conv:02', 'demo:h02', 'Wi-Fi and kitchen access. Electricity is split. This reply is seeded demo copy.', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:06', 'demo:conv:02', 'demo:s02', 'Thanks, I will keep this in my saved list.', '2026-10-19T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:03', 'demo:lst:03', '2026-10-13T08:46:12.670Z', '2026-10-24T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:03', 'demo:s03', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:03', 'demo:h03', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:07', 'demo:conv:03', 'demo:s03', 'Would a working professional be fine?', '2026-10-16T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:08', 'demo:conv:03', 'demo:h03', 'Yes, that is who the room is set up for.', '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:09', 'demo:conv:03', 'demo:s03', 'Thanks, I will keep this in my saved list.', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:04', 'demo:lst:04', '2026-10-14T08:46:12.670Z', '2026-10-23T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:04', 'demo:s04', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:04', 'demo:h04', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:10', 'demo:conv:04', 'demo:s04', 'Can I see one more photo of the kitchen?', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:11', 'demo:conv:04', 'demo:h04', 'The kitchen photo is on the listing. Happy to answer other questions here.', '2026-10-19T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:12', 'demo:conv:04', 'demo:s04', 'Thanks, I will keep this in my saved list.', '2026-10-20T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:05', 'demo:lst:05', '2026-10-15T08:46:12.670Z', '2026-10-22T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:05', 'demo:s05', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:05', 'demo:h05', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:13', 'demo:conv:05', 'demo:s05', 'Is food included?', '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:14', 'demo:conv:05', 'demo:h05', 'Only on the listings marked food available.', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:15', 'demo:conv:05', 'demo:s05', 'Thanks, I will keep this in my saved list.', '2026-10-19T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:06', 'demo:lst:06', '2026-10-16T08:46:12.670Z', '2026-10-21T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:06', 'demo:s06', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:06', 'demo:h06', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:16', 'demo:conv:06', 'demo:s06', 'Is this room still free next month?', '2026-10-16T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:17', 'demo:conv:06', 'demo:h06', 'Yes. It is a demo listing, so visits are not scheduled, but the enquiry thread works.', '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:18', 'demo:conv:06', 'demo:s06', 'Thanks, I will keep this in my saved list.', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:07', 'demo:lst:07', '2026-10-17T08:46:12.670Z', '2026-10-26T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:07', 'demo:s07', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:07', 'demo:h07', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:19', 'demo:conv:07', 'demo:s07', 'What is included in the rent?', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:20', 'demo:conv:07', 'demo:h07', 'Wi-Fi and kitchen access. Electricity is split. This reply is seeded demo copy.', '2026-10-19T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:21', 'demo:conv:07', 'demo:s07', 'Thanks, I will keep this in my saved list.', '2026-10-20T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:08', 'demo:lst:08', '2026-10-18T08:46:12.670Z', '2026-10-25T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:08', 'demo:s08', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:08', 'demo:h08', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:22', 'demo:conv:08', 'demo:s08', 'Would a working professional be fine?', '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:23', 'demo:conv:08', 'demo:h08', 'Yes, that is who the room is set up for.', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:24', 'demo:conv:08', 'demo:s08', 'Thanks, I will keep this in my saved list.', '2026-10-19T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:09', 'demo:lst:09', '2026-10-19T08:46:12.670Z', '2026-10-24T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:09', 'demo:s09', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:09', 'demo:h09', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:25', 'demo:conv:09', 'demo:s09', 'Can I see one more photo of the kitchen?', '2026-10-16T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:26', 'demo:conv:09', 'demo:h09', 'The kitchen photo is on the listing. Happy to answer other questions here.', '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:27', 'demo:conv:09', 'demo:s09', 'Thanks, I will keep this in my saved list.', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:10', 'demo:lst:10', '2026-10-20T08:46:12.670Z', '2026-10-23T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:10', 'demo:s10', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:10', 'demo:h10', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:28', 'demo:conv:10', 'demo:s10', 'Is food included?', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:29', 'demo:conv:10', 'demo:h10', 'Only on the listings marked food available.', '2026-10-19T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:30', 'demo:conv:10', 'demo:s10', 'Thanks, I will keep this in my saved list.', '2026-10-20T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:11', 'demo:lst:11', '2026-10-11T08:46:12.670Z', '2026-10-22T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:11', 'demo:s11', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:11', 'demo:h11', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:31', 'demo:conv:11', 'demo:s11', 'Is this room still free next month?', '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:32', 'demo:conv:11', 'demo:h11', 'Yes. It is a demo listing, so visits are not scheduled, but the enquiry thread works.', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:12', 'demo:lst:12', '2026-10-12T08:46:12.670Z', '2026-10-21T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:12', 'demo:s12', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:12', 'demo:h12', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:33', 'demo:conv:12', 'demo:s12', 'What is included in the rent?', '2026-10-16T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:34', 'demo:conv:12', 'demo:h12', 'Wi-Fi and kitchen access. Electricity is split. This reply is seeded demo copy.', '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:13', 'demo:lst:13', '2026-10-13T08:46:12.670Z', '2026-10-26T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:13', 'demo:s13', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:13', 'demo:h13', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:35', 'demo:conv:13', 'demo:s13', 'Would a working professional be fine?', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:36', 'demo:conv:13', 'demo:h13', 'Yes, that is who the room is set up for.', '2026-10-19T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:14', 'demo:lst:14', '2026-10-14T08:46:12.670Z', '2026-10-25T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:14', 'demo:s14', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:14', 'demo:h14', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:37', 'demo:conv:14', 'demo:s14', 'Can I see one more photo of the kitchen?', '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:38', 'demo:conv:14', 'demo:h14', 'The kitchen photo is on the listing. Happy to answer other questions here.', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:15', 'demo:lst:15', '2026-10-15T08:46:12.670Z', '2026-10-24T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:15', 'demo:s15', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:15', 'demo:h15', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:39', 'demo:conv:15', 'demo:s15', 'Is food included?', '2026-10-16T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:40', 'demo:conv:15', 'demo:h15', 'Only on the listings marked food available.', '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:16', 'demo:lst:16', '2026-10-16T08:46:12.670Z', '2026-10-23T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:16', 'demo:s16', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:16', 'demo:h16', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:41', 'demo:conv:16', 'demo:s16', 'Is this room still free next month?', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:42', 'demo:conv:16', 'demo:h16', 'Yes. It is a demo listing, so visits are not scheduled, but the enquiry thread works.', '2026-10-19T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:17', 'demo:lst:17', '2026-10-17T08:46:12.670Z', '2026-10-22T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:17', 'demo:s17', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:17', 'demo:h17', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:43', 'demo:conv:17', 'demo:s17', 'What is included in the rent?', '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:44', 'demo:conv:17', 'demo:h17', 'Wi-Fi and kitchen access. Electricity is split. This reply is seeded demo copy.', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:18', 'demo:lst:18', '2026-10-18T08:46:12.670Z', '2026-10-21T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:18', 'demo:s18', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:18', 'demo:h18', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:45', 'demo:conv:18', 'demo:s18', 'Would a working professional be fine?', '2026-10-16T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:46', 'demo:conv:18', 'demo:h18', 'Yes, that is who the room is set up for.', '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:19', 'demo:lst:19', '2026-10-19T08:46:12.670Z', '2026-10-26T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:19', 'demo:s19', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:19', 'demo:h19', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:47', 'demo:conv:19', 'demo:s19', 'Can I see one more photo of the kitchen?', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:48', 'demo:conv:19', 'demo:h19', 'The kitchen photo is on the listing. Happy to answer other questions here.', '2026-10-19T08:46:12.670Z') on conflict (id) do nothing;
insert into conversations (id, listing_id, created_at, updated_at) values ('demo:conv:20', 'demo:lst:20', '2026-10-20T08:46:12.670Z', '2026-10-25T08:46:12.670Z') on conflict (id) do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:20', 'demo:s20', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into conversation_members (conversation_id, user_id, last_read_at) values ('demo:conv:20', 'demo:h20', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:49', 'demo:conv:20', 'demo:s20', 'Is food included?', '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into messages (id, conversation_id, sender_id, body, created_at) values ('demo:msg:50', 'demo:conv:20', 'demo:h20', 'Only on the listings marked food available.', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s01', 'demo:lst:01', '2026-10-26T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s02', 'demo:lst:03', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s03', 'demo:lst:05', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s04', 'demo:lst:07', '2026-10-23T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s05', 'demo:lst:09', '2026-10-22T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s06', 'demo:lst:11', '2026-10-21T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s07', 'demo:lst:13', '2026-10-20T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s08', 'demo:lst:15', '2026-10-19T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s09', 'demo:lst:17', '2026-10-18T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s10', 'demo:lst:19', '2026-10-17T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s11', 'demo:lst:21', '2026-10-16T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s12', 'demo:lst:23', '2026-10-15T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s13', 'demo:lst:25', '2026-10-26T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s14', 'demo:lst:27', '2026-10-25T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s15', 'demo:lst:29', '2026-10-24T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s16', 'demo:lst:31', '2026-10-23T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s17', 'demo:lst:33', '2026-10-22T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s18', 'demo:lst:35', '2026-10-21T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s19', 'demo:lst:37', '2026-10-20T08:46:12.670Z') on conflict do nothing;
insert into saved_listings (user_id, listing_id, created_at) values ('demo:s20', 'demo:lst:39', '2026-10-19T08:46:12.670Z') on conflict do nothing;
insert into applications (id, listing_id, user_id, message, status, created_at) values ('demo:app:1', 'demo:lst:03', 'demo:s01', 'I can move on the date listed and will follow the house rules. Demo application.', 'accepted', '2026-10-14T08:46:12.670Z') on conflict (id) do nothing;
insert into recorded_matches (id, seeker_id, listing_id, score, created_at) values ('demo:match:1', 'demo:s01', 'demo:lst:01', 78, '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into applications (id, listing_id, user_id, message, status, created_at) values ('demo:app:2', 'demo:lst:04', 'demo:s02', 'I can move on the date listed and will follow the house rules. Demo application.', 'accepted', '2026-10-15T08:46:12.670Z') on conflict (id) do nothing;
insert into recorded_matches (id, seeker_id, listing_id, score, created_at) values ('demo:match:2', 'demo:s02', 'demo:lst:02', 79, '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into applications (id, listing_id, user_id, message, status, created_at) values ('demo:app:3', 'demo:lst:05', 'demo:s03', 'I can move on the date listed and will follow the house rules. Demo application.', 'accepted', '2026-10-16T08:46:12.670Z') on conflict (id) do nothing;
insert into recorded_matches (id, seeker_id, listing_id, score, created_at) values ('demo:match:3', 'demo:s03', 'demo:lst:03', 80, '2026-10-19T08:46:12.670Z') on conflict (id) do nothing;
insert into applications (id, listing_id, user_id, message, status, created_at) values ('demo:app:4', 'demo:lst:06', 'demo:s04', 'I can move on the date listed and will follow the house rules. Demo application.', 'accepted', '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into recorded_matches (id, seeker_id, listing_id, score, created_at) values ('demo:match:4', 'demo:s04', 'demo:lst:04', 81, '2026-10-20T08:46:12.670Z') on conflict (id) do nothing;
insert into applications (id, listing_id, user_id, message, status, created_at) values ('demo:app:5', 'demo:lst:07', 'demo:s05', 'I can move on the date listed and will follow the house rules. Demo application.', 'pending', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into recorded_matches (id, seeker_id, listing_id, score, created_at) values ('demo:match:5', 'demo:s05', 'demo:lst:05', 82, '2026-10-21T08:46:12.670Z') on conflict (id) do nothing;
insert into applications (id, listing_id, user_id, message, status, created_at) values ('demo:app:6', 'demo:lst:08', 'demo:s06', 'I can move on the date listed and will follow the house rules. Demo application.', 'pending', '2026-10-19T08:46:12.670Z') on conflict (id) do nothing;
insert into recorded_matches (id, seeker_id, listing_id, score, created_at) values ('demo:match:6', 'demo:s06', 'demo:lst:06', 83, '2026-10-22T08:46:12.670Z') on conflict (id) do nothing;
insert into applications (id, listing_id, user_id, message, status, created_at) values ('demo:app:7', 'demo:lst:09', 'demo:s07', 'I can move on the date listed and will follow the house rules. Demo application.', 'pending', '2026-10-20T08:46:12.670Z') on conflict (id) do nothing;
insert into recorded_matches (id, seeker_id, listing_id, score, created_at) values ('demo:match:7', 'demo:s07', 'demo:lst:07', 84, '2026-10-23T08:46:12.670Z') on conflict (id) do nothing;
insert into applications (id, listing_id, user_id, message, status, created_at) values ('demo:app:8', 'demo:lst:10', 'demo:s08', 'I can move on the date listed and will follow the house rules. Demo application.', 'declined', '2026-10-21T08:46:12.670Z') on conflict (id) do nothing;
insert into recorded_matches (id, seeker_id, listing_id, score, created_at) values ('demo:match:8', 'demo:s08', 'demo:lst:08', 85, '2026-10-24T08:46:12.670Z') on conflict (id) do nothing;
insert into applications (id, listing_id, user_id, message, status, created_at) values ('demo:app:9', 'demo:lst:11', 'demo:s09', 'I can move on the date listed and will follow the house rules. Demo application.', 'declined', '2026-10-22T08:46:12.670Z') on conflict (id) do nothing;
insert into recorded_matches (id, seeker_id, listing_id, score, created_at) values ('demo:match:9', 'demo:s09', 'demo:lst:09', 86, '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into applications (id, listing_id, user_id, message, status, created_at) values ('demo:app:10', 'demo:lst:12', 'demo:s10', 'I can move on the date listed and will follow the house rules. Demo application.', 'declined', '2026-10-23T08:46:12.670Z') on conflict (id) do nothing;
insert into recorded_matches (id, seeker_id, listing_id, score, created_at) values ('demo:match:10', 'demo:s10', 'demo:lst:10', 87, '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into reports (id, reporter_id, target_type, target_id, category, details, status, created_at) values (
    'demo:rep:1', 'demo:s01', 'user', 'demo:h01',
    'scam', 'Seeded demo report for the moderation queue.', 'open', '2026-10-21T08:46:12.670Z') on conflict (id) do nothing;
insert into reports (id, reporter_id, target_type, target_id, category, details, status, created_at) values (
    'demo:rep:2', 'demo:s02', 'listing', 'demo:lst:02',
    'fake', 'Seeded demo report for the moderation queue.', 'open', '2026-10-20T08:46:12.670Z') on conflict (id) do nothing;
insert into reports (id, reporter_id, target_type, target_id, category, details, status, created_at) values (
    'demo:rep:3', 'demo:s03', 'listing', 'demo:lst:03',
    'wrong', 'Seeded demo report for the moderation queue.', 'open', '2026-10-19T08:46:12.670Z') on conflict (id) do nothing;
insert into reports (id, reporter_id, target_type, target_id, category, details, status, created_at) values (
    'demo:rep:4', 'demo:s04', 'user', 'demo:h04',
    'harassment', 'Seeded demo report for the moderation queue.', 'open', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into reports (id, reporter_id, target_type, target_id, category, details, status, created_at) values (
    'demo:rep:5', 'demo:s05', 'listing', 'demo:lst:05',
    'unsafe', 'Seeded demo report for the moderation queue.', 'open', '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into reports (id, reporter_id, target_type, target_id, category, details, status, created_at) values (
    'demo:rep:6', 'demo:s06', 'listing', 'demo:lst:06',
    'illegal', 'Seeded demo report for the moderation queue.', 'open', '2026-10-16T08:46:12.670Z') on conflict (id) do nothing;
insert into reports (id, reporter_id, target_type, target_id, category, details, status, created_at) values (
    'demo:rep:7', 'demo:s07', 'user', 'demo:h07',
    'duplicate', 'Seeded demo report for the moderation queue.', 'closed', '2026-10-15T08:46:12.670Z') on conflict (id) do nothing;
insert into reports (id, reporter_id, target_type, target_id, category, details, status, created_at) values (
    'demo:rep:8', 'demo:s08', 'listing', 'demo:lst:08',
    'other', 'Seeded demo report for the moderation queue.', 'closed', '2026-10-14T08:46:12.670Z') on conflict (id) do nothing;
insert into reports (id, reporter_id, target_type, target_id, category, details, status, created_at) values (
    'demo:rep:9', 'demo:s09', 'listing', 'demo:lst:09',
    'fake', 'Seeded demo report for the moderation queue.', 'closed', '2026-10-13T08:46:12.670Z') on conflict (id) do nothing;
insert into reports (id, reporter_id, target_type, target_id, category, details, status, created_at) values (
    'demo:rep:10', 'demo:s10', 'user', 'demo:h10',
    'wrong', 'Seeded demo report for the moderation queue.', 'closed', '2026-10-12T08:46:12.670Z') on conflict (id) do nothing;
insert into verification_requests (id, user_id, listing_id, kind, status, notes, created_at) values (
    'demo:ver:1', 'demo:h11', 'demo:lst:21', 'identity', 'pending',
    'Demo verification packet: photos and a note. No government ID is stored in this prototype.', '2026-10-23T08:46:12.670Z') on conflict (id) do nothing;
insert into verification_requests (id, user_id, listing_id, kind, status, notes, created_at) values (
    'demo:ver:2', 'demo:h12', 'demo:lst:22', 'property', 'pending',
    'Demo verification packet: photos and a note. No government ID is stored in this prototype.', '2026-10-22T08:46:12.670Z') on conflict (id) do nothing;
insert into verification_requests (id, user_id, listing_id, kind, status, notes, created_at) values (
    'demo:ver:3', 'demo:h13', 'demo:lst:23', 'identity', 'pending',
    'Demo verification packet: photos and a note. No government ID is stored in this prototype.', '2026-10-21T08:46:12.670Z') on conflict (id) do nothing;
insert into verification_requests (id, user_id, listing_id, kind, status, notes, created_at) values (
    'demo:ver:4', 'demo:h14', 'demo:lst:24', 'property', 'pending',
    'Demo verification packet: photos and a note. No government ID is stored in this prototype.', '2026-10-20T08:46:12.670Z') on conflict (id) do nothing;
insert into verification_requests (id, user_id, listing_id, kind, status, notes, created_at) values (
    'demo:ver:5', 'demo:h15', 'demo:lst:25', 'identity', 'pending',
    'Demo verification packet: photos and a note. No government ID is stored in this prototype.', '2026-10-19T08:46:12.670Z') on conflict (id) do nothing;
insert into verification_requests (id, user_id, listing_id, kind, status, notes, created_at) values (
    'demo:ver:6', 'demo:h16', 'demo:lst:26', 'property', 'pending',
    'Demo verification packet: photos and a note. No government ID is stored in this prototype.', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:1', 'demo:s01', 'bengaluru', 'bengaluru', '2026-10-26T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:2', 'demo:s02', 'mumbai', 'mumbai', '2026-10-25T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:3', 'demo:s03', 'delhi-ncr', 'delhi-ncr', '2026-10-24T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:4', 'demo:s04', 'hyderabad', 'hyderabad', '2026-10-23T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:5', 'demo:s05', 'pune', 'pune', '2026-10-22T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:6', 'demo:s06', 'chennai', 'chennai', '2026-10-21T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:7', 'demo:s07', 'kolkata', 'kolkata', '2026-10-20T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:8', 'demo:s08', 'ahmedabad', 'ahmedabad', '2026-10-19T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:9', 'demo:s09', 'gurugram', 'gurugram', '2026-10-18T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:10', 'demo:s10', 'noida', 'noida', '2026-10-17T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:11', 'demo:s11', 'chandigarh', 'chandigarh', '2026-10-16T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:12', 'demo:s12', 'jaipur', 'jaipur', '2026-10-15T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:13', 'demo:s13', 'kochi', 'kochi', '2026-10-14T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:14', 'demo:s14', 'mangalore', 'mangalore', '2026-10-13T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:15', 'demo:s15', 'mysuru', 'mysuru', '2026-10-12T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:16', 'demo:s16', 'manipal', 'manipal', '2026-10-11T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:17', 'demo:s17', 'udupi', 'udupi', '2026-10-10T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:18', 'demo:s18', 'coimbatore', 'coimbatore', '2026-10-09T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:19', 'demo:s19', 'bengaluru', 'bengaluru', '2026-10-08T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:20', 'demo:s20', 'mumbai', 'mumbai', '2026-10-07T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:21', 'demo:s21', 'delhi-ncr', 'delhi-ncr', '2026-10-26T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:22', 'demo:s22', 'hyderabad', 'hyderabad', '2026-10-25T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:23', 'demo:s23', 'pune', 'pune', '2026-10-24T08:46:12.670Z') on conflict (id) do nothing;
insert into search_events (id, user_id, city_id, query, created_at) values ('demo:search:24', 'demo:s24', 'chennai', 'chennai', '2026-10-23T08:46:12.670Z') on conflict (id) do nothing;
insert into audit_log (id, actor_id, action, target, meta) values ('demo:audit:1', 'system', 'seed', 'marketplace', '{"note":"Demo seed loaded"}'::jsonb) on conflict (id) do nothing;
