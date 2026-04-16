-- ═══════════════════════════════════════════════════════════════
-- DASM-services — Initial Schema (DASM Souq marketplace)
-- Target project: bmfqfmsxtotdksvcqfrh.supabase.co
-- Date: 2026-04-16 (session 56)
-- ═══════════════════════════════════════════════════════════════
--
-- Architecture reference: memory/architecture_data_ownership_map.md
--
--   Core (ttkhiatwayvlfksvehzm): users, cars, real_estates, farm_assets,
--     auctions, bids, wallets, ledger, orders, settlements, market_categories
--
--   Services (this DB): marketplace listings (display cards), favorites,
--     views telemetry, shipping execution, inspection execution
--
-- Cross-DB reference pattern:
--   external_user_id    bigint  → Core.users.id
--   external_listable_type text → 'Car' | 'RealEstate' | 'FarmAsset' | NULL
--   external_listable_id bigint → Core.{cars|real_estates|farm_assets}.id
--   section_id bigint           → Core.market_categories.id (cached)
--   section_slug text           → denormalized for queries
-- ═══════════════════════════════════════════════════════════════

-- UUID support
create extension if not exists "pgcrypto";

-- ═══════════════════════════════════════════════════════════════
-- 1. marketplace_listings (البطاقة الرئيسية في سوق داسم)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.marketplace_listings (
  id                      uuid         primary key default gen_random_uuid(),

  -- Cross-DB references to Core
  external_user_id        bigint       not null,
  external_listable_type  text         check (external_listable_type in ('Car','RealEstate','FarmAsset')),
  external_listable_id    bigint,

  -- Section (cached from Core.market_categories)
  section_id              bigint       not null,
  section_slug            text         not null,
  tag_slug                text,

  -- Content (display card)
  title                   text         not null,
  description             text,
  images                  jsonb        not null default '[]'::jsonb,

  -- Price
  price                   numeric(14,2),
  is_negotiable           boolean      not null default true,
  currency                text         not null default 'SAR',

  -- Location (cached from Core.areas)
  area_code               text,
  city                    text,

  -- Status & lifecycle
  status                  text         not null default 'pending' check (status in ('pending','active','paused','sold','deleted','expired')),
  is_auctionable          boolean      not null default false,
  requires_settlement     boolean      not null default false,

  -- Metrics
  views_count             integer      not null default 0,
  favorites_count         integer      not null default 0,

  -- Promotion
  featured_until          timestamptz,

  -- Timestamps
  published_at            timestamptz,
  expires_at              timestamptz,
  sold_at                 timestamptz,
  created_at              timestamptz  not null default now(),
  updated_at              timestamptz  not null default now()
);

comment on table public.marketplace_listings is
  'Display cards for سوق داسم. NOT business truth — transactions finalize in Core.';
comment on column public.marketplace_listings.external_user_id is
  'FK to Core.users.id (cross-DB, no enforced FK).';
comment on column public.marketplace_listings.requires_settlement is
  'Triggers the "بدء الإجراءات الرسمية" button for big-ticket items (cars/real-estate).';

create index if not exists idx_listings_section_status
  on public.marketplace_listings (section_slug, status, published_at desc);

create index if not exists idx_listings_area_status
  on public.marketplace_listings (area_code, status);

create index if not exists idx_listings_user
  on public.marketplace_listings (external_user_id);

create index if not exists idx_listings_external_ref
  on public.marketplace_listings (external_listable_type, external_listable_id)
  where external_listable_id is not null;

create index if not exists idx_listings_featured
  on public.marketplace_listings (featured_until)
  where featured_until is not null;

-- Auto-update updated_at
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists set_updated_at on public.marketplace_listings;
create trigger set_updated_at before update on public.marketplace_listings
for each row execute function public.tg_set_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- 2. marketplace_favorites (المفضلة للمستخدم)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.marketplace_favorites (
  id                  bigserial    primary key,
  external_user_id    bigint       not null,
  listing_id          uuid         not null references public.marketplace_listings(id) on delete cascade,
  created_at          timestamptz  not null default now(),
  unique (external_user_id, listing_id)
);

create index if not exists idx_favorites_user on public.marketplace_favorites (external_user_id, created_at desc);

-- ═══════════════════════════════════════════════════════════════
-- 3. marketplace_views (telemetry — محدود بالتنظيف الدوري)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.marketplace_views (
  id                  bigserial    primary key,
  listing_id          uuid         not null references public.marketplace_listings(id) on delete cascade,
  viewer_user_id      bigint,
  viewer_ip           inet,
  user_agent          text,
  viewed_at           timestamptz  not null default now()
);

create index if not exists idx_views_listing_time on public.marketplace_views (listing_id, viewed_at desc);
create index if not exists idx_views_time on public.marketplace_views (viewed_at);

-- ═══════════════════════════════════════════════════════════════
-- 4. marketplace_shipping_orders (تنفيذ الشحن — Services layer)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.marketplace_shipping_orders (
  id                  uuid         primary key default gen_random_uuid(),
  listing_id          uuid         not null references public.marketplace_listings(id) on delete set null,
  external_order_id   bigint,
  provider            text         check (provider in ('redbox','smsa','aramex','naqel','other')),
  tracking_number     text,
  origin_city         text,
  destination_city    text,
  cost                numeric(10,2),
  estimated_days      integer,
  status              text         not null default 'pending' check (status in ('pending','picked_up','in_transit','delivered','returned','failed','canceled')),
  events              jsonb        not null default '[]'::jsonb,
  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now()
);

create index if not exists idx_shipping_listing on public.marketplace_shipping_orders (listing_id);
create index if not exists idx_shipping_status on public.marketplace_shipping_orders (status);

drop trigger if exists set_updated_at_shipping on public.marketplace_shipping_orders;
create trigger set_updated_at_shipping before update on public.marketplace_shipping_orders
for each row execute function public.tg_set_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- 5. marketplace_inspection_reports (تنفيذ الفحص)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.marketplace_inspection_reports (
  id                  uuid         primary key default gen_random_uuid(),
  listing_id          uuid         not null references public.marketplace_listings(id) on delete cascade,
  external_request_id bigint,
  inspector_name      text,
  report_url          text,
  rating              smallint     check (rating between 1 and 10),
  issues              jsonb        not null default '[]'::jsonb,
  inspected_at        timestamptz,
  created_at          timestamptz  not null default now()
);

create index if not exists idx_inspection_listing on public.marketplace_inspection_reports (listing_id);

-- ═══════════════════════════════════════════════════════════════
-- 6. Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════════

alter table public.marketplace_listings           enable row level security;
alter table public.marketplace_favorites          enable row level security;
alter table public.marketplace_views              enable row level security;
alter table public.marketplace_shipping_orders    enable row level security;
alter table public.marketplace_inspection_reports enable row level security;

-- Anon + authenticated can read active listings
drop policy if exists "public_read_active_listings" on public.marketplace_listings;
create policy "public_read_active_listings" on public.marketplace_listings
  for select using (status = 'active');

-- Owner can read own listings in any status (via service role on server)
drop policy if exists "public_read_own_listings" on public.marketplace_listings;
-- NOTE: owner-mode reads go through server-side (service role). No public self-read policy needed.

-- Favorites: only service role writes (server-side verifies Sanctum user first)
-- Views: service role only inserts
-- Shipping/inspection: service role only

-- ═══════════════════════════════════════════════════════════════
-- 7. Helper view: active featured listings (for home page)
-- ═══════════════════════════════════════════════════════════════

create or replace view public.v_active_featured_listings as
select *
from public.marketplace_listings
where status = 'active'
  and featured_until is not null
  and featured_until > now()
order by published_at desc;

grant select on public.v_active_featured_listings to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- DONE — verify with:
--   select table_name from information_schema.tables
--   where table_schema='public' order by table_name;
-- ═══════════════════════════════════════════════════════════════
