-- ============================================================
-- POLICIES RLS CORRETAS: Permitir usuários lerem próprios dados
-- EXECUTE ESTE SQL NO PAINEL DO SUPABASE
-- ============================================================

-- Remover policy que pode estar bloqueando leitura própria
DROP POLICY IF EXISTS "user_manage_self" ON public.app_users;

-- Criar policy para usuários lerem e editarem próprios dados
CREATE POLICY "users_manage_own_profile" ON public.app_users
FOR ALL USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verificar se admin e outras policies ainda existem
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'app_users'
ORDER BY cmd, policyname;