-- ============================================================
-- Promover usuário atual para Admin Global
-- ============================================================

-- 1. Verificar usuários existentes
SELECT id, email, role, city_id FROM public.app_users;

-- 2. Promover usuário específico para admin (substitua o ID)
-- EXECUTE APENAS UM DOS COMANDOS ABAIXO:

-- Opção A: Promover usuário específico (use o ID do seu usuário)
UPDATE public.app_users 
SET role = 'admin', city_id = NULL 
WHERE id = '6c310790-3f19-4bc8-9e9e-14b4089bdce2'; -- Seu ID atual

-- Opção B: Promover por email (mais seguro)
UPDATE public.app_users 
SET role = 'admin', city_id = NULL 
WHERE email = 'diretoria@inovartel.com.br';

-- 3. Verificar se funcionou
SELECT id, email, role, city_id FROM public.app_users WHERE role = 'admin';