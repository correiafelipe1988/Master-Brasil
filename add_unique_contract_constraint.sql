-- ============================================================
-- Adicionar Constraint Única para Evitar Duplicação de Contratos
-- ============================================================

-- 1. Primeiro, vamos limpar possíveis duplicatas existentes
-- (manter apenas o mais recente de cada tipo por rental_id)

WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY template_id, rental_id 
      ORDER BY created_at DESC
    ) as rn
  FROM public.generated_contracts
  WHERE rental_id IS NOT NULL
)
DELETE FROM public.generated_contracts 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 2. Adicionar constraint única para evitar duplicação futura
-- Permite apenas um contrato por template_id + rental_id
ALTER TABLE public.generated_contracts 
ADD CONSTRAINT unique_contract_per_rental_template 
UNIQUE (template_id, rental_id);

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_generated_contracts_unique_check 
ON public.generated_contracts(template_id, rental_id) 
WHERE rental_id IS NOT NULL;

-- 4. Comentário explicativo
COMMENT ON CONSTRAINT unique_contract_per_rental_template 
ON public.generated_contracts IS 
'Impede a criação de múltiplos contratos do mesmo template para a mesma locação';
