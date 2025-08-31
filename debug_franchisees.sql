-- Script para verificar os franqueados cadastrados
-- Execute no SQL Editor do Supabase

-- 1. Verificar se existem franqueados na tabela
SELECT 'Franqueados na tabela:' as info;
SELECT id, fantasy_name, company_name, cnpj, status, city_id 
FROM public.franchisees 
ORDER BY fantasy_name;

-- 2. Verificar quantos estão ativos
SELECT 'Franqueados por status:' as info;
SELECT status, count(*) as quantidade
FROM public.franchisees 
GROUP BY status;

-- 3. Verificar se RLS está afetando
SELECT 'Testando query específica:' as info;
SELECT id, fantasy_name, company_name, cnpj, city_id
FROM public.franchisees
WHERE status = 'ativo'
ORDER BY fantasy_name;