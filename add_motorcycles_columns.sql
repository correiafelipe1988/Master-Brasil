-- ============================================================
-- Adicionar colunas necessárias à tabela motorcycles
-- ============================================================

-- 1. Verificar estrutura atual
SELECT 'Estrutura atual da tabela motorcycles:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'motorcycles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar colunas faltantes

-- Código/CS da moto
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS codigo_cs VARCHAR(10);

-- Tipo da moto (Nova/Usada)
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'Usada' CHECK (tipo IN ('Nova', 'Usada'));

-- Valor semanal
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS valor_semanal DECIMAL(10,2);

-- Comentários/observações
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 3. Criar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_motorcycles_codigo_cs ON public.motorcycles(codigo_cs);
CREATE INDEX IF NOT EXISTS idx_motorcycles_tipo ON public.motorcycles(tipo);
CREATE INDEX IF NOT EXISTS idx_motorcycles_valor_semanal ON public.motorcycles(valor_semanal);

-- 4. Atualizar alguns registros de exemplo com os novos campos
UPDATE public.motorcycles 
SET 
  codigo_cs = CASE 
    WHEN placa = 'ABC1234' THEN 'SKM0199'
    WHEN placa = 'XYZ5678' THEN 'TGZ2136' 
    WHEN placa = 'DEF9101' THEN 'TKA4J90'
    ELSE CONCAT('CS', LPAD((RANDOM() * 9999)::INT::TEXT, 4, '0'))
  END,
  tipo = CASE 
    WHEN RANDOM() > 0.7 THEN 'Nova'
    ELSE 'Usada'
  END,
  valor_semanal = CASE 
    WHEN RANDOM() > 0.5 THEN ROUND((RANDOM() * 200 + 250)::NUMERIC, 2)
    ELSE NULL
  END
WHERE codigo_cs IS NULL;

-- 5. Verificar estrutura atualizada
SELECT 'Estrutura atualizada da tabela motorcycles:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'motorcycles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar dados de exemplo
SELECT 'Dados de exemplo com novas colunas:' as info;
SELECT placa, modelo, status, codigo_cs, tipo, valor_semanal, data_ultima_mov
FROM public.motorcycles 
LIMIT 5;