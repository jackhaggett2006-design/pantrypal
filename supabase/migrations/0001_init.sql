-- PantryPal initial schema
-- Run this in the Supabase SQL Editor (or via the Supabase CLI).
-- All user data tables use Row-Level Security so a user can only see their own rows.

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ============================================================
-- profiles: one row per auth user
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- macro_goals: one active goal set per user
-- ============================================================
create table if not exists public.macro_goals (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  calories   integer not null default 2000,
  protein_g  integer not null default 150,
  carbs_g    integer not null default 200,
  fat_g      integer not null default 65,
  updated_at timestamptz not null default now()
);

alter table public.macro_goals enable row level security;

create policy "macro_goals: all own"
  on public.macro_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- pantry_items: what is currently in the fridge/pantry
-- ============================================================
create table if not exists public.pantry_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  icon_key        text,                         -- maps to a curated food icon
  quantity        numeric,
  unit            text,
  category        text,                         -- produce, dairy, meat, pantry, ...
  fdc_id          integer,                      -- USDA FoodData Central id
  macros_per_100g jsonb,                        -- { calories, protein_g, carbs_g, fat_g }
  source          text not null default 'manual', -- receipt | photo | manual
  added_at        timestamptz not null default now(),
  expires_at      date
);

create index if not exists pantry_items_user_idx on public.pantry_items (user_id);

alter table public.pantry_items enable row level security;

create policy "pantry_items: all own"
  on public.pantry_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- intake_log: what the user actually ate (feeds the macro tracker)
-- ============================================================
create table if not exists public.intake_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  logged_on  date not null default (now() at time zone 'utc')::date,
  food_name  text not null,
  quantity   numeric,
  unit       text,
  calories   numeric not null default 0,
  protein_g  numeric not null default 0,
  carbs_g    numeric not null default 0,
  fat_g      numeric not null default 0,
  source     text,                              -- pantry | manual | recipe
  created_at timestamptz not null default now()
);

create index if not exists intake_log_user_day_idx on public.intake_log (user_id, logged_on);

alter table public.intake_log enable row level security;

create policy "intake_log: all own"
  on public.intake_log for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- recipes + recipe_ingredients
-- ============================================================
create table if not exists public.recipes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  description text,
  servings    integer default 1,
  steps       jsonb not null default '[]'::jsonb, -- ordered array of step strings/objects
  macros      jsonb,                               -- per-serving { calories, protein_g, carbs_g, fat_g }
  source      text not null default 'user',        -- ai | user
  image_url   text,
  created_at  timestamptz not null default now()
);

create index if not exists recipes_user_idx on public.recipes (user_id);

alter table public.recipes enable row level security;

create policy "recipes: all own"
  on public.recipes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.recipe_ingredients (
  id        uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  name      text not null,
  quantity  numeric,
  unit      text,
  fdc_id    integer
);

create index if not exists recipe_ingredients_recipe_idx on public.recipe_ingredients (recipe_id);

alter table public.recipe_ingredients enable row level security;

-- Ingredients inherit access from their parent recipe.
create policy "recipe_ingredients: all via own recipe"
  on public.recipe_ingredients for all
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredients.recipe_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredients.recipe_id and r.user_id = auth.uid()
    )
  );

-- ============================================================
-- nutrition_cache: shared cache of USDA lookups (read-all, no user data)
-- ============================================================
create table if not exists public.nutrition_cache (
  fdc_id          integer primary key,
  name            text not null,
  macros_per_100g jsonb not null,
  cached_at       timestamptz not null default now()
);

alter table public.nutrition_cache enable row level security;

-- Any authenticated user may read the shared cache; writes go through the
-- service-role client (which bypasses RLS), so no write policy is defined.
create policy "nutrition_cache: read for authenticated"
  on public.nutrition_cache for select
  to authenticated
  using (true);
