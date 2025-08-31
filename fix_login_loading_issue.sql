-- ============================================================
-- CORREÇÃO URGENTE: App não carrega após login
-- ============================================================

-- 1. Ver todas as policies atuais
SELECT 'POLICIES ATUAIS:' as info;
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'app_users'
ORDER BY cmd, policyname;

-- 2. Remover todas as policies problemáticas
DROP POLICY IF EXISTS "user_manage_self" ON public.app_users;
DROP POLICY IF EXISTS "admin_manage_all_users" ON public.app_users;
DROP POLICY IF EXISTS "master_br_read_all_users" ON public.app_users;
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.app_users;

-- 3. Criar policies corretas e simples
-- Usuário pode gerenciar próprio registro
CREATE POLICY "users_manage_own_profile" ON public.app_users
FOR ALL USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin pode tudo
CREATE POLICY "admin_manage_all_users" ON public.app_users
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Verificar resultado
SELECT 'POLICIES APÓS CORREÇÃO:' as info;
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies 
WHERE tablename = 'app_users'
ORDER BY cmd, policyname;

-- 5. Testar consulta básica
SELECT 'TESTE DE CONSULTA:' as info;
SELECT id, email, role FROM public.app_users LIMIT 3;