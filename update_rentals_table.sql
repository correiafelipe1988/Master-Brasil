-- Script para atualizar a tabela rentals para permitir end_date como NULL
-- Execute este script no SQL Editor do Supabase

-- Permitir que end_date seja NULL (para locações em aberto)
ALTER TABLE public.rentals 
ALTER COLUMN end_date DROP NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.rentals.end_date IS 'Data de fim da locação (NULL para locações em aberto)';

-- Verificar se a alteração foi aplicada
SELECT 
  column_name, 
  is_nullable, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'rentals' 
  AND table_schema = 'public' 
  AND column_name IN ('start_date', 'end_date');
