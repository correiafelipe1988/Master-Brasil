-- ============================================================
-- SOLUÇÃO FINAL: RLS para Cities (mais permissivo)
-- ============================================================

-- 1. Remover TODAS as políticas existentes
drop policy if exists "city users read own city - cities" on public.cities;
drop policy if exists "admin all - cities" on public.cities;
drop policy if exists "authenticated users read cities" on public.cities;

-- 2. Criar política MUITO mais permissiva para leitura
-- QUALQUER usuário autenticado pode ler cities (necessário para onboarding)
create policy "allow_authenticated_read_cities" on public.cities
for select using (true);

-- 3. Apenas admins podem modificar cities
create policy "allow_admin_all_cities" on public.cities
for all using (
  auth.uid() in (
    select id from public.app_users where role = 'admin'
  )
)
with check (
  auth.uid() in (
    select id from public.app_users where role = 'admin'
  )
);