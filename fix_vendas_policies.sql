-- Script para corrigir as políticas RLS da tabela vendas
-- Execute este script no SQL Editor do Supabase

-- Remover políticas existentes
DROP POLICY IF EXISTS "admin_master_all_vendas" ON public.vendas;
DROP POLICY IF EXISTS "regional_own_city_vendas" ON public.vendas;

-- Políticas RLS para vendas baseadas no padrão do projeto

-- Admin e Master BR: acesso total
CREATE POLICY "admin_master_br_all_vendas" ON public.vendas
FOR ALL USING (
  (auth.jwt() ->> 'role') IN ('admin', 'master_br')
);

-- Regional: apenas vendas de sua cidade
CREATE POLICY "regional_own_city_read_vendas" ON public.vendas
FOR SELECT USING (
  (auth.jwt() ->> 'role') = 'regional' 
  AND city_id = (auth.jwt() ->> 'city_id')::uuid
);

CREATE POLICY "regional_own_city_insert_vendas" ON public.vendas
FOR INSERT WITH CHECK (
  (auth.jwt() ->> 'role') = 'regional' 
  AND city_id = (auth.jwt() ->> 'city_id')::uuid
);

CREATE POLICY "regional_own_city_update_vendas" ON public.vendas
FOR UPDATE USING (
  (auth.jwt() ->> 'role') = 'regional' 
  AND city_id = (auth.jwt() ->> 'city_id')::uuid
);

-- Verificar se RLS está habilitado
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- Testar a consulta
SELECT 'Políticas RLS atualizadas com sucesso!' as status;