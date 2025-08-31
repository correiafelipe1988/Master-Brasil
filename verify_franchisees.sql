-- Verificar se os franqueados foram associados corretamente
-- Execute no SQL Editor do Supabase

-- Ver todos os franqueados ativos com o city_id correto
SELECT 
  f.id,
  f.fantasy_name,
  f.company_name,
  f.cnpj,
  f.status,
  f.city_id,
  c.name as cidade
FROM public.franchisees f
LEFT JOIN public.cities c ON f.city_id = c.id
WHERE f.status = 'ativo' 
  AND f.city_id = '73fbe697-17c3-4f2f-a727-75c55cbc8dea'
ORDER BY f.fantasy_name;