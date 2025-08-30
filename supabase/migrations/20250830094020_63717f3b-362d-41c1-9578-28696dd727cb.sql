-- ============================================================
-- CRM Multi-Cidades: Tabelas + RLS + Views (Pronto p/ Supabase)
-- ============================================================

-- Requisitos de extensões (Supabase geralmente já possui):
create extension if not exists "pgcrypto";
-- (usa gen_random_uuid())

-- ---------------------------------------
-- Funções auxiliares (JWT e helpers RLS)
-- ---------------------------------------
create or replace function public.jwt() returns jsonb
language sql stable as $$
  select current_setting('request.jwt.claims', true)::jsonb
$$;

create or replace function public.jwt_role() returns text
language sql stable as $$
  select coalesce(public.jwt()->>'role','')
$$;

create or replace function public.jwt_city_id() returns uuid
language sql stable as $$
  select nullif(public.jwt()->>'city_id','')::uuid
$$;

-- (Supabase) auth.uid() retorna o user_id do token. Se não estiver usando Supabase Auth, ignore.

-- ------------------------------------------------
-- Tabelas base: cities, app_users, leads, deals...
-- ------------------------------------------------
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,   -- ex.: "salvador"
  name text not null,          -- ex.: "Salvador"
  created_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key,         -- ideal: mesmo id do auth.users (Supabase)
  email text unique not null,
  role text not null check (role in ('city_user','admin')),
  city_id uuid references public.cities(id) on delete set null,  -- null para admin
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  name text not null,
  phone text,
  source text,
  status text,
  created_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null,
  amount numeric(12,2) not null default 0,
  stage text not null default 'novo',  -- ex.: novo, qualificado, proposta, ganho, perdido
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  lead_id uuid references public.leads(id) on delete set null,
  kind text not null,                  -- ex.: call, whatsapp, visit, note
  notes text,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------
-- (Opcional) Unicidade por cidade p/ telefones de leads:
-- --------------------------------------------------------
create unique index if not exists leads_city_phone_unique
  on public.leads (city_id, phone)
  where phone is not null;

-- --------------------------------------
-- Triggers p/ preencher city_id seguro
-- --------------------------------------
create or replace function public.apply_default_city()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Se for city_user, força o city_id do JWT quando não informado
  if public.jwt_role() = 'city_user' then
    if new.city_id is null then
      new.city_id := public.jwt_city_id();
    end if;
    -- Bloqueia tentativa de inserir em outra cidade
    if new.city_id is distinct from public.jwt_city_id() then
      raise exception 'city_user só pode inserir/alterar dados da própria city_id';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_default_city_leads on public.leads;
create trigger trg_default_city_leads
before insert or update on public.leads
for each row execute function public.apply_default_city();

drop trigger if exists trg_default_city_deals on public.deals;
create trigger trg_default_city_deals
before insert or update on public.deals
for each row execute function public.apply_default_city();

drop trigger if exists trg_default_city_activities on public.activities;
create trigger trg_default_city_activities
before insert or update on public.activities
for each row execute function public.apply_default_city();

-- ---------------------------------
-- Habilitar RLS nas tabelas-alvo
-- ---------------------------------
alter table public.cities enable row level security;
alter table public.app_users enable row level security;
alter table public.leads enable row level security;
alter table public.deals enable row level security;
alter table public.activities enable row level security;

-- ---------------------------------
-- POLICIES (RLS)
-- ---------------------------------

-- CITIES
-- city_user: só pode ver a própria cidade (conforme JWT.city_id)
drop policy if exists "city users read own city - cities" on public.cities;
create policy "city users read own city - cities" on public.cities
for select using (
  public.jwt_role() = 'city_user'
  and id = public.jwt_city_id()
);

-- admin: pode ler/escrever tudo em cities
drop policy if exists "admin all - cities" on public.cities;
create policy "admin all - cities" on public.cities
for all using (public.jwt_role() = 'admin')
with check (public.jwt_role() = 'admin');

-- APP_USERS
-- city_user: pode ver apenas o próprio registro (mesmo id do auth.uid(), se usar Supabase)
drop policy if exists "city users read self - app_users" on public.app_users;
create policy "city users read self - app_users" on public.app_users
for select using (
  public.jwt_role() = 'city_user'
  and id = auth.uid()
);

-- admin: pode tudo
drop policy if exists "admin all - app_users" on public.app_users;
create policy "admin all - app_users" on public.app_users
for all using (public.jwt_role() = 'admin')
with check (public.jwt_role() = 'admin');

-- LEADS
-- city_user: ler/escrever apenas da própria cidade
drop policy if exists "city users read own city - leads" on public.leads;
create policy "city users read own city - leads" on public.leads
for select using (
  public.jwt_role() = 'city_user'
  and city_id = public.jwt_city_id()
);

drop policy if exists "city users write own city - leads" on public.leads;
create policy "city users write own city - leads" on public.leads
for insert with check (
  public.jwt_role() = 'city_user'
  and city_id = public.jwt_city_id()
);

drop policy if exists "city users update own city - leads" on public.leads;
create policy "city users update own city - leads" on public.leads
for update using (
  public.jwt_role() = 'city_user'
  and city_id = public.jwt_city_id()
);

-- admin: tudo em leads
drop policy if exists "admin all - leads" on public.leads;
create policy "admin all - leads" on public.leads
for all using (public.jwt_role() = 'admin')
with check (public.jwt_role() = 'admin');

-- DEALS
drop policy if exists "city users read own city - deals" on public.deals;
create policy "city users read own city - deals" on public.deals
for select using (
  public.jwt_role() = 'city_user'
  and city_id = public.jwt_city_id()
);

drop policy if exists "city users write own city - deals" on public.deals;
create policy "city users write own city - deals" on public.deals
for insert with check (
  public.jwt_role() = 'city_user'
  and city_id = public.jwt_city_id()
);

drop policy if exists "city users update own city - deals" on public.deals;
create policy "city users update own city - deals" on public.deals
for update using (
  public.jwt_role() = 'city_user'
  and city_id = public.jwt_city_id()
);

drop policy if exists "admin all - deals" on public.deals;
create policy "admin all - deals" on public.deals
for all using (public.jwt_role() = 'admin')
with check (public.jwt_role() = 'admin');

-- ACTIVITIES
drop policy if exists "city users read own city - activities" on public.activities;
create policy "city users read own city - activities" on public.activities
for select using (
  public.jwt_role() = 'city_user'
  and city_id = public.jwt_city_id()
);

drop policy if exists "city users write own city - activities" on public.activities;
create policy "city users write own city - activities" on public.activities
for insert with check (
  public.jwt_role() = 'city_user'
  and city_id = public.jwt_city_id()
);

drop policy if exists "city users update own city - activities" on public.activities;
create policy "city users update own city - activities" on public.activities
for update using (
  public.jwt_role() = 'city_user'
  and city_id = public.jwt_city_id()
);

drop policy if exists "admin all - activities" on public.activities;
create policy "admin all - activities" on public.activities
for all using (public.jwt_role() = 'admin')
with check (public.jwt_role() = 'admin');

-- --------------
-- ÍNDICES
-- --------------
create index if not exists idx_leads_city_id on public.leads(city_id);
create index if not exists idx_deals_city_id on public.deals(city_id);
create index if not exists idx_deals_stage_city on public.deals(city_id, stage);
create index if not exists idx_deals_created_city on public.deals(city_id, created_at);
create index if not exists idx_activities_city_id on public.activities(city_id);
create index if not exists idx_activities_due_city on public.activities(city_id, due_at);

-- --------------------------
-- Views de consolidação (Admin)
-- --------------------------
create or replace view public.v_admin_pipeline as
select
  c.name as city,
  d.id,
  d.title,
  d.amount,
  d.stage,
  d.created_at
from public.deals d
join public.cities c on c.id = d.city_id;

create or replace view public.v_admin_kpis as
select
  c.name as city,
  count(*) filter (where d.stage = 'ganho') as deals_ganhos,
  sum(d.amount) filter (where d.stage = 'ganho') as receita_ganha,
  count(*) as deals_total
from public.deals d
join public.cities c on c.id = d.city_id
group by 1;

-- -------------------------------------
-- Seeds de exemplo (opcional, para teste)
-- -------------------------------------
-- Cidades
insert into public.cities (slug, name)
values ('salvador','Salvador'),
       ('rio-de-janeiro','Rio de Janeiro')
on conflict (slug) do nothing;