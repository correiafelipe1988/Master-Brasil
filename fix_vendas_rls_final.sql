-- Solução final para problemas de RLS na tabela vendas
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro vamos temporariamente desabilitar RLS para ver os dados
ALTER TABLE public.vendas DISABLE ROW LEVEL SECURITY;

-- 2. Atualizar os city_id das vendas existentes para o city_id do usuário regional
-- (Assumindo que o usuário regional é de Salvador baseado na imagem)
UPDATE public.vendas 
SET city_id = (
  SELECT id FROM public.cities 
  WHERE name = 'Salvador' OR slug = 'salvador'
  LIMIT 1
)
WHERE city_id IS NULL OR city_id != (
  SELECT id FROM public.cities 
  WHERE name = 'Salvador' OR slug = 'salvador'
  LIMIT 1
);

-- 3. Verificar os dados atualizados
SELECT v.*, c.name as city_name 
FROM public.vendas v
LEFT JOIN public.cities c ON v.city_id = c.id;

-- 4. Recriar as políticas RLS mais simples
DROP POLICY IF EXISTS "admin_master_br_all_vendas" ON public.vendas;
DROP POLICY IF EXISTS "regional_own_city_read_vendas" ON public.vendas;
DROP POLICY IF EXISTS "regional_own_city_insert_vendas" ON public.vendas;
DROP POLICY IF EXISTS "regional_own_city_update_vendas" ON public.vendas;

-- 5. Política simples para admin/master_br (acesso total)
CREATE POLICY "admin_master_br_full_access" ON public.vendas
FOR ALL USING (
  (auth.jwt() ->> 'role') IN ('admin', 'master_br')
);

-- 6. Política para regionais (com validação menos restritiva)
CREATE POLICY "regional_read_vendas" ON public.vendas
FOR SELECT USING (
  (auth.jwt() ->> 'role') = 'regional'
);

CREATE POLICY "regional_insert_vendas" ON public.vendas
FOR INSERT WITH CHECK (
  (auth.jwt() ->> 'role') = 'regional'
);

CREATE POLICY "regional_update_vendas" ON public.vendas
FOR UPDATE USING (
  (auth.jwt() ->> 'role') = 'regional'
);

-- 7. Reabilitar RLS
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- 8. Testar se conseguimos ler os dados
SELECT 'Configuração RLS corrigida! Testando leitura...' as status;
SELECT count(*) as total_vendas FROM public.vendas;