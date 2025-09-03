-- Script para corrigir políticas RLS da tabela rental_plans
-- Execute este script no SQL Editor do Supabase

-- Primeiro, remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Admins can do everything on rental_plans" ON public.rental_plans;
DROP POLICY IF EXISTS "City users can manage rental_plans in their city" ON public.rental_plans;

-- Criar política mais permissiva para admins e master_br
CREATE POLICY "Admins and Master BR can access all rental_plans" ON public.rental_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE id = auth.uid() AND role IN ('admin', 'master_br')
    )
  );

-- Criar política para usuários regionais e franqueados (acesso à sua cidade)
CREATE POLICY "Regional and Franchisee users can access rental_plans in their city" ON public.rental_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE id = auth.uid() 
      AND role IN ('regional', 'franchisee')
      AND city_id = rental_plans.city_id
    )
  );

-- Política mais genérica para outros usuários autenticados (caso necessário)
CREATE POLICY "Authenticated users can read rental_plans" ON public.rental_plans
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Verificar se há dados na tabela
SELECT 
  rp.*,
  c.name as city_name,
  c.slug as city_slug
FROM public.rental_plans rp
LEFT JOIN public.cities c ON c.id = rp.city_id
ORDER BY rp.created_at DESC;

-- Comentário: Se não houver dados, execute o script original para inserir dados de exemplo