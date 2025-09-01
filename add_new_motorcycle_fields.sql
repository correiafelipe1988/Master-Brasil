-- ============================================================
-- Adicionar novos campos à tabela motorcycles conforme nova interface
-- ============================================================

-- 1. Verificar estrutura atual
SELECT 'Estrutura atual da tabela motorcycles:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'motorcycles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar novos campos necessários

-- Chassi (17 caracteres)
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS chassi VARCHAR(17);

-- RENAVAM (11 dígitos)
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS renavam VARCHAR(11);

-- Marca
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS marca VARCHAR(50);

-- Ano
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS ano INTEGER;

-- Cor
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS cor VARCHAR(30);

-- Quilometragem
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS quilometragem INTEGER;

-- 3. Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_motorcycles_chassi ON public.motorcycles(chassi);
CREATE INDEX IF NOT EXISTS idx_motorcycles_renavam ON public.motorcycles(renavam);
CREATE INDEX IF NOT EXISTS idx_motorcycles_marca ON public.motorcycles(marca);
CREATE INDEX IF NOT EXISTS idx_motorcycles_ano ON public.motorcycles(ano);

-- 4. Adicionar constraint para ano válido (primeiro verificar se não existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_ano_valid') THEN
        ALTER TABLE public.motorcycles ADD CONSTRAINT check_ano_valid 
        CHECK (ano IS NULL OR (ano >= 1990 AND ano <= EXTRACT(YEAR FROM NOW()) + 1));
    END IF;
END $$;

-- 5. Adicionar constraint para quilometragem válida (primeiro verificar se não existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_quilometragem_valid') THEN
        ALTER TABLE public.motorcycles ADD CONSTRAINT check_quilometragem_valid 
        CHECK (quilometragem IS NULL OR quilometragem >= 0);
    END IF;
END $$;

-- 6. Verificar estrutura atualizada
SELECT 'Estrutura atualizada da tabela motorcycles:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'motorcycles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Verificar constraints
SELECT 'Constraints da tabela motorcycles:' as info;
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'motorcycles' AND table_schema = 'public';

SELECT 'Novos campos adicionados com sucesso!' as success;