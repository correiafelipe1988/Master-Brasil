-- ============================================================
-- Adicionar campos de contato à tabela franchisees
-- ============================================================

-- 1. Verificar estrutura atual
SELECT 'Estrutura atual da tabela franchisees:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'franchisees' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar novos campos de contato

-- CPF do responsável (11 dígitos)
ALTER TABLE public.franchisees ADD COLUMN IF NOT EXISTS cpf VARCHAR(11);

-- Endereço completo
ALTER TABLE public.franchisees ADD COLUMN IF NOT EXISTS endereco TEXT;

-- Email de contato
ALTER TABLE public.franchisees ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- WhatsApp principal
ALTER TABLE public.franchisees ADD COLUMN IF NOT EXISTS whatsapp_01 VARCHAR(15);

-- WhatsApp secundário
ALTER TABLE public.franchisees ADD COLUMN IF NOT EXISTS whatsapp_02 VARCHAR(15);

-- 3. Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_franchisees_cpf ON public.franchisees(cpf);
CREATE INDEX IF NOT EXISTS idx_franchisees_email ON public.franchisees(email);

-- 4. Adicionar constraints de validação

-- CPF deve ser único quando não for nulo
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'franchisees_cpf_unique') THEN
        ALTER TABLE public.franchisees ADD CONSTRAINT franchisees_cpf_unique 
        UNIQUE (cpf);
    END IF;
END $$;

-- Email deve ser único quando não for nulo
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'franchisees_email_unique') THEN
        ALTER TABLE public.franchisees ADD CONSTRAINT franchisees_email_unique 
        UNIQUE (email);
    END IF;
END $$;

-- 5. Verificar estrutura atualizada
SELECT 'Estrutura atualizada da tabela franchisees:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'franchisees' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar constraints
SELECT 'Constraints da tabela franchisees:' as info;
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'franchisees' AND table_schema = 'public';

SELECT 'Novos campos de contato adicionados com sucesso!' as success;