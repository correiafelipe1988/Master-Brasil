-- ============================================================
-- Corrigir RLS da tabela cities para permitir leitura durante onboarding
-- ============================================================

-- Remover políticas existentes da tabela cities
drop policy if exists "city users read own city - cities" on public.cities;
drop policy if exists "admin all - cities" on public.cities;

-- Nova política: usuários autenticados podem ler todas as cidades
-- (necessário para o onboarding funcionar)
create policy "authenticated users read cities" on public.cities
for select using (auth.role() = 'authenticated');

-- Admin pode fazer tudo em cities
create policy "admin all - cities" on public.cities
for all using (
  exists (
    select 1 from public.app_users 
    where id = auth.uid() and role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.app_users 
    where id = auth.uid() and role = 'admin'
  )
);

-- Inserir cidades de teste se não existirem
insert into public.cities (slug, name)
values 
  ('salvador','Salvador'),
  ('rio-de-janeiro','Rio de Janeiro'),
  ('sao-paulo','São Paulo'),
  ('brasilia','Brasília'),
  ('belo-horizonte','Belo Horizonte'),
  ('fortaleza','Fortaleza')
on conflict (slug) do nothing;