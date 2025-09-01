-- ============================================================
-- Debug das políticas RLS na tabela motorcycles
-- ============================================================

-- 1. Verificar políticas RLS existentes
SELECT 'Políticas RLS atuais na tabela motorcycles:' as info;
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'motorcycles'
ORDER BY cmd, policyname;

-- 2. Testar se franqueado consegue ver apenas suas motos
-- (Execute este comando logado como franqueado)
SELECT 'Teste de acesso para franqueado atual:' as info;
SELECT m.id, m.placa, m.modelo, m.status, m.franchisee_id,
       au.email as franchisee_email,
       CASE 
         WHEN m.franchisee_id = auth.uid() THEN 'SUA MOTO'
         ELSE 'MOTO DE OUTRO FRANQUEADO'
       END as ownership
FROM public.motorcycles m
LEFT JOIN public.app_users au ON m.franchisee_id = au.id
WHERE m.city_id = (SELECT city_id FROM public.app_users WHERE id = auth.uid())
ORDER BY m.placa;

-- 3. Verificar se RLS está habilitado
SELECT 'Status do RLS:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'motorcycles';

-- 4. Verificar usuário atual
SELECT 'Usuário atual:' as info;
SELECT auth.uid() as current_user_id, auth.email() as current_email;