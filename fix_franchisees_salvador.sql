-- Corrigir franqueados para cidade de Salvador
-- Execute no SQL Editor do Supabase

-- 1. Verificar o city_id correto de Salvador
SELECT 'City ID de Salvador:' as info;
SELECT id, name, slug FROM public.cities WHERE name = 'Salvador' OR slug = 'salvador';

-- 2. Ver franqueados que não estão associados a Salvador corretamente
SELECT 'Franqueados ativos não associados a Salvador:' as info;
SELECT f.id, f.fantasy_name, f.cnpj, f.city_id, c.name as cidade_atual
FROM public.franchisees f
LEFT JOIN public.cities c ON f.city_id = c.id
WHERE f.status = 'ativo'
  AND (f.city_id IS NULL OR c.name != 'Salvador');

-- 3. Atualizar TODOS os franqueados ativos para Salvador
-- (usando o city_id que aparece no console: 73fbe697-17c3-4f2f-a727-75c55cbc8dea)
UPDATE public.franchisees 
SET city_id = '73fbe697-17c3-4f2f-a727-75c55cbc8dea'
WHERE status = 'ativo';

-- 4. Verificar resultado final
SELECT 'Resultado após correção:' as info;
SELECT 
  f.id,
  f.fantasy_name,
  f.cnpj,
  f.status,
  c.name as cidade
FROM public.franchisees f
JOIN public.cities c ON f.city_id = c.id
WHERE f.status = 'ativo' 
  AND f.city_id = '73fbe697-17c3-4f2f-a727-75c55cbc8dea'
ORDER BY f.fantasy_name;