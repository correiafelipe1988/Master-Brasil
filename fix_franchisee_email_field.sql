-- ============================================================
-- Solução definitiva: Adicionar campo email na tabela franchisees
-- ============================================================

-- 1. Adicionar coluna email na tabela franchisees
ALTER TABLE public.franchisees 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Atualizar registros existentes com emails dos app_users correspondentes
UPDATE public.franchisees 
SET email = au.email 
FROM public.app_users au 
WHERE franchisees.user_id = au.id 
AND franchisees.email IS NULL;

-- 3. Verificar resultado
SELECT id, cnpj, company_name, email, user_id 
FROM public.franchisees 
WHERE user_id IS NOT NULL;

-- 4. Para novos franqueados, o email será preenchido automaticamente
-- durante o processo de cadastro no código