-- ============================================================
-- Corrigir políticas RLS para permitir DELETE de motocicletas
-- ============================================================

-- 1. Verificar políticas existentes
SELECT 'Políticas RLS existentes para motorcycles:' as info;
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'motorcycles'
ORDER BY cmd, policyname;

-- 2. Remover políticas existentes se necessário
DROP POLICY IF EXISTS "admin_manage_all_motorcycles" ON public.motorcycles;
DROP POLICY IF EXISTS "master_br_read_all_motorcycles" ON public.motorcycles;
DROP POLICY IF EXISTS "regional_manage_city_motorcycles" ON public.motorcycles;
DROP POLICY IF EXISTS "franchisee_manage_own_motorcycles" ON public.motorcycles;

-- 3. Criar políticas mais permissivas para admins

-- Admin: pode fazer tudo (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "admin_all_motorcycles" ON public.motorcycles
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
);

-- Master_br: pode ler todas as motos e gerenciar
CREATE POLICY "master_br_all_motorcycles" ON public.motorcycles
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'master_br')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'master_br')
);

-- Regional: pode gerenciar motos da sua cidade
CREATE POLICY "regional_city_motorcycles" ON public.motorcycles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND role = 'regional' 
    AND city_id = motorcycles.city_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND role = 'regional' 
    AND city_id = motorcycles.city_id
  )
);

-- Franchisee: pode gerenciar apenas suas próprias motos
CREATE POLICY "franchisee_own_motorcycles" ON public.motorcycles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND role = 'franchisee'
    AND city_id = motorcycles.city_id
    AND motorcycles.franchisee_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND role = 'franchisee'
    AND city_id = motorcycles.city_id
    AND motorcycles.franchisee_id = auth.uid()
  )
);

-- 4. Verificar políticas criadas
SELECT 'Novas políticas RLS para motorcycles:' as info;
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'motorcycles'
ORDER BY cmd, policyname;

-- 5. Testar permissões (verificar usuário atual)
SELECT 'Usuário atual:' as info;
SELECT auth.uid() as user_id, 
       u.email, 
       u.role, 
       u.city_id,
       c.name as city_name
FROM public.app_users u
LEFT JOIN public.cities c ON c.id = u.city_id
WHERE u.id = auth.uid();

-- 6. Verificar se pode ver as motos
SELECT 'Motos visíveis para o usuário atual:' as info;
SELECT COUNT(*) as total_motos_visiveis FROM public.motorcycles;