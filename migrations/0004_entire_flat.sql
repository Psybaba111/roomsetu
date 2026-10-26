alter table listings add column if not exists listing_kind text not null default 'room';
alter table listings add column if not exists property_facts jsonb not null default '{}'::jsonb;

insert into amenities (id, label) values ('security', 'Security') on conflict (id) do nothing;
insert into amenities (id, label) values ('gas', 'Piped gas') on conflict (id) do nothing;
insert into amenities (id, label) values ('gym', 'Gym') on conflict (id) do nothing;
insert into amenities (id, label) values ('club', 'Clubhouse') on conflict (id) do nothing;
insert into amenities (id, label) values ('park', 'Park') on conflict (id) do nothing;

update listings set
  listing_kind = 'entire',
  property_facts = jsonb_build_object(
    'builtUpSqft', case room_type when '1bhk' then 650 when '2bhk' then 1050 else 1480 end,
    'bathrooms', case room_type when '1bhk' then 1 when '2bhk' then 2 else 3 end,
    'balconies', case room_type when '1bhk' then 1 else 2 end,
    'floor', 3,
    'totalFloors', 10,
    'facing', 'east',
    'society', 'Sample society',
    'maintenance', case room_type when '3bhk' then 4500 when '2bhk' then 3000 else 1800 end,
    'suitableFor', 'family',
    'postedBy', 'owner'
  )
where is_demo = true and room_type in ('1bhk', '2bhk', '3bhk');
