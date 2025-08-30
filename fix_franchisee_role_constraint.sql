-- ============================================================
-- Corrigir constraint de role para aceitar 'franchisee'
-- ============================================================

-- 1. Primeiro, verificar constraint atual
DO $$
BEGIN
    -- Remover constraint existente se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'app_users_role_check' 
        AND table_name = 'app_users'
    ) THEN
        ALTER TABLE public.app_users DROP CONSTRAINT app_users_role_check;
        RAISE NOTICE 'Constraint app_users_role_check removida';
    END IF;

    -- Verificar se há outras constraints de role
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%role%' 
        AND constraint_name != 'app_users_role_check'
    ) THEN
        RAISE NOTICE 'Outras constraints de role encontradas - verificar manualmente';
    END IF;
END $$;

-- 2. Adicionar nova constraint com todos os 4 roles
ALTER TABLE public.app_users 
ADD CONSTRAINT app_users_role_check 
CHECK (role IN ('admin', 'master_br', 'regional', 'franchisee'));

-- 3. Verificar registros existentes que possam ter roles inválidos
SELECT 
    id, 
    email, 
    role,
    CASE 
        WHEN role NOT IN ('admin', 'master_br', 'regional', 'franchisee') THEN 'ROLE INVÁLIDO'
        ELSE 'OK'
    END as status
FROM public.app_users 
WHERE role NOT IN ('admin', 'master_br', 'regional', 'franchisee');

-- 4. Se necessário, atualizar roles inválidos (descomente se houver registros inválidos)
-- UPDATE public.app_users SET role = 'regional' WHERE role = 'city_user';

COMMIT;