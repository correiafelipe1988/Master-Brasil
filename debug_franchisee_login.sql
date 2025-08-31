-- ============================================================
-- DEBUG: Verificar se franqueados conseguem consultar app_users
-- ============================================================

-- 1. Ver policies atuais de app_users
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'app_users'
ORDER BY cmd, policyname;

-- 2. Ver um exemplo de franchisee com user_id
SELECT id, cnpj, company_name, user_id, city_id
FROM public.franchisees 
WHERE user_id IS NOT NULL
LIMIT 1;

-- 3. Ver se esse app_user correspondente existe
-- (Substituir o user_id encontrado acima)
-- SELECT id, email, role, city_id 
-- FROM public.app_users 
-- WHERE id = 'USER_ID_DO_FRANCHISEE_ACIMA';

-- 4. Problema provável: RLS está bloqueando consulta app_users por ID específico
-- quando não é o próprio usuário logado (auth.uid() != id)
-- 
-- Solução: Criar policy permitindo que qualquer usuário logado
-- consulte email de app_users para validação de login