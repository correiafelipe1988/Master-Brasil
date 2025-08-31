-- Teste rápido para verificar acesso às vendas
-- Execute este script para diagnosticar o problema

-- 1. Verificar os dados brutos na tabela
SELECT 'Dados na tabela vendas:' as info;
SELECT id, data_compra, parceiro, status, city_id FROM public.vendas;

-- 2. Verificar as políticas RLS ativas
SELECT 'Políticas RLS ativas:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'vendas';

-- 3. Verificar o JWT atual (se disponível)
SELECT 'JWT atual:' as info;
SELECT auth.jwt();

-- 4. Testar acesso direto com role regional simulado
-- (Isso pode falhar se RLS estiver bloqueando)
SELECT 'Testando acesso simulado:' as info;
SELECT count(*) as total FROM public.vendas;

-- 5. Se nada funcionar, vamos temporariamente desabilitar RLS
-- DESCOMENTE A LINHA ABAIXO SE NECESSÁRIO:
-- ALTER TABLE public.vendas DISABLE ROW LEVEL SECURITY;