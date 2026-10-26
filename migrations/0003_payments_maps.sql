alter table listings add column if not exists featured_until timestamptz;
alter table profiles add column if not exists premium_until timestamptz;
alter table payments add column if not exists order_id text not null default '';
alter table payments add column if not exists provider_payment_id text not null default '';
alter table payments add column if not exists fulfilled boolean not null default false;
