-- ============================================================
-- Tabela de Clientes para o CRM
-- ============================================================

-- Criar tabela de clientes
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  
  -- Dados pessoais
  full_name text not null,
  cpf text unique not null,
  rg text,
  birth_date date,
  phone text not null,
  email text,
  profession text,
  
  -- Endereço
  address text,
  number text,
  city text,
  state text default 'MG',
  zip_code text,
  
  -- CNH (Carteira Nacional de Habilitação)
  cnh_number text,
  cnh_category text,
  cnh_expiry_date date,
  cnh_photo_url text,
  
  -- Status do cliente
  status text not null default 'ativo' check (status in ('ativo', 'inativo', 'bloqueado')),
  
  -- Metadados
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para performance
create index if not exists idx_clients_city_id on public.clients(city_id);
create index if not exists idx_clients_status on public.clients(status);
create index if not exists idx_clients_cpf on public.clients(cpf);
create index if not exists idx_clients_phone on public.clients(phone);
create index if not exists idx_clients_created_at on public.clients(created_at);

-- Trigger para atualizar updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
  before update on public.clients
  for each row execute function public.update_updated_at_column();

-- Aplicar trigger de city_id para clientes
drop trigger if exists trg_default_city_clients on public.clients;
create trigger trg_default_city_clients
before insert or update on public.clients
for each row execute function public.apply_default_city();

-- Habilitar RLS
alter table public.clients enable row level security;

-- Políticas RLS para clientes
-- Usuários regionais podem ver apenas clientes da sua cidade
drop policy if exists "regional users read own city - clients" on public.clients;
create policy "regional users read own city - clients" on public.clients
for select using (
  public.jwt_role() in ('regional', 'city_user')
  and city_id = public.jwt_city_id()
);

drop policy if exists "regional users write own city - clients" on public.clients;
create policy "regional users write own city - clients" on public.clients
for insert with check (
  public.jwt_role() in ('regional', 'city_user')
  and city_id = public.jwt_city_id()
);

drop policy if exists "regional users update own city - clients" on public.clients;
create policy "regional users update own city - clients" on public.clients
for update using (
  public.jwt_role() in ('regional', 'city_user')
  and city_id = public.jwt_city_id()
);

drop policy if exists "regional users delete own city - clients" on public.clients;
create policy "regional users delete own city - clients" on public.clients
for delete using (
  public.jwt_role() in ('regional', 'city_user')
  and city_id = public.jwt_city_id()
);

-- Admin e Master BR podem ver tudo
drop policy if exists "admin all - clients" on public.clients;
create policy "admin all - clients" on public.clients
for all using (public.jwt_role() in ('admin', 'master_br'))
with check (public.jwt_role() in ('admin', 'master_br'));

-- Índice único para CPF por cidade (permitir mesmo CPF em cidades diferentes se necessário)
-- create unique index if not exists clients_city_cpf_unique
--   on public.clients (city_id, cpf);
