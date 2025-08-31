-- Script para verificar e corrigir franqueados por cidade
-- Execute no SQL Editor do Supabase

-- 1. Verificar quantos franqueados existem e suas cidades
SELECT 'Franqueados por cidade:' as info;
SELECT 
  c.name as cidade,
  c.id as city_id,
  COUNT(f.id) as total_franqueados
FROM public.cities c
LEFT JOIN public.franchisees f ON f.city_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;

-- 2. Verificar franqueados sem cidade definida
SELECT 'Franqueados sem city_id:' as info;
SELECT id, fantasy_name, company_name, cnpj, city_id, status
FROM public.franchisees 
WHERE city_id IS NULL;

-- 3. Ver todos os franqueados com suas cidades
SELECT 'Todos os franqueados:' as info;
SELECT 
  f.id,
  f.fantasy_name,
  f.company_name,
  f.cnpj,
  f.status,
  c.name as cidade,
  f.city_id
FROM public.franchisees f
LEFT JOIN public.cities c ON f.city_id = c.id
ORDER BY f.fantasy_name;

-- 4. Atualizar franqueados para Salvador (se necessário)
-- DESCOMENTE AS LINHAS ABAIXO SE QUISER ASSOCIAR TODOS A SALVADOR:
-- UPDATE public.franchisees 
-- SET city_id = (
--   SELECT id FROM public.cities 
--   WHERE name = 'Salvador' OR slug = 'salvador'
--   LIMIT 1
-- )
-- WHERE city_id IS NULL OR city_id != (
--   SELECT id FROM public.cities 
--   WHERE name = 'Salvador' OR slug = 'salvador'
--   LIMIT 1
-- );

-- 5. Verificar o resultado final
SELECT 'Resultado final:' as info;
SELECT 
  f.fantasy_name,
  f.cnpj,
  f.status,
  c.name as cidade
FROM public.franchisees f
LEFT JOIN public.cities c ON f.city_id = c.id
WHERE f.status = 'ativo'
  AND c.name = 'Salvador'
ORDER BY f.fantasy_name;