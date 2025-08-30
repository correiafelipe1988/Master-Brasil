-- ============================================================
-- Corrigir RLS da tabela app_users para permitir onboarding
-- ============================================================

-- 1. Remover políticas existentes da tabela app_users
drop policy if exists "city users read self - app_users" on public.app_users;
drop policy if exists "admin all - app_users" on public.app_users;

-- 2. Permitir que usuários autenticados façam upsert de seu próprio registro
-- (necessário para onboarding funcionar)
create policy "allow_user_upsert_self - app_users" on public.app_users
for all using (auth.uid() = id)
with check (auth.uid() = id);

-- 3. Admin pode fazer tudo
create policy "allow_admin_all - app_users" on public.app_users
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