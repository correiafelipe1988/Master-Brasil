-- ============================================================
-- Atualizar policies RLS para suportar 4 níveis hierárquicos
-- ============================================================

-- 1. Atualizar policies do app_users para suportar novos roles
DROP POLICY IF EXISTS "user_manage_own_record" ON public.app_users;
DROP POLICY IF EXISTS "admin_full_access" ON public.app_users;
DROP POLICY IF EXISTS "user_manage_self" ON public.app_users;
DROP POLICY IF EXISTS "admin_manage_all_users" ON public.app_users;
DROP POLICY IF EXISTS "master_br_read_all_users" ON public.app_users;

-- Usuário pode gerenciar próprio registro
CREATE POLICY "user_manage_self" ON public.app_users
FOR ALL USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin pode tudo
CREATE POLICY "admin_manage_all_users" ON public.app_users
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
);

-- Master_br pode ler todos (read-only global)
CREATE POLICY "master_br_read_all_users" ON public.app_users
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('master_br', 'admin'))
);

-- 2. Policies para franchisees
CREATE POLICY "admin_manage_franchisees" ON public.franchisees
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "regional_manage_franchisees_in_city" ON public.franchisees
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND role = 'regional' 
    AND city_id = franchisees.city_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND role = 'regional' 
    AND city_id = franchisees.city_id
  )
);

CREATE POLICY "master_br_read_franchisees" ON public.franchisees
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('master_br', 'admin'))
);

CREATE POLICY "franchisee_read_own" ON public.franchisees
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND role = 'franchisee' 
    AND franchisee_id = franchisees.id
  )
);

-- 3. Atualizar policies de leads para nova hierarquia
DROP POLICY IF EXISTS "city users read own city - leads" ON public.leads;
DROP POLICY IF EXISTS "city users write own city - leads" ON public.leads;
DROP POLICY IF EXISTS "city users update own city - leads" ON public.leads;
DROP POLICY IF EXISTS "admin all - leads" ON public.leads;
DROP POLICY IF EXISTS "regional_manage_city_leads" ON public.leads;
DROP POLICY IF EXISTS "franchisee_manage_own_leads" ON public.leads;
DROP POLICY IF EXISTS "master_br_read_all_leads" ON public.leads;
DROP POLICY IF EXISTS "admin_manage_all_leads" ON public.leads;

-- Regional: pode gerenciar leads da sua cidade (antigo city_user)
CREATE POLICY "regional_manage_city_leads" ON public.leads
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND role = 'regional' 
    AND city_id = leads.city_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND role = 'regional' 
    AND city_id = leads.city_id
  )
);

-- Franchisee: só vê próprios leads (mesmo CNPJ/cidade)
CREATE POLICY "franchisee_manage_own_leads" ON public.leads
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.app_users au
    JOIN public.franchisees f ON au.franchisee_id = f.id
    WHERE au.id = auth.uid() AND au.role = 'franchisee' 
    AND f.city_id = leads.city_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users au
    JOIN public.franchisees f ON au.franchisee_id = f.id
    WHERE au.id = auth.uid() AND au.role = 'franchisee' 
    AND f.city_id = leads.city_id
  )
);

-- Master_br: read-only global (vê todos os leads)
CREATE POLICY "master_br_read_all_leads" ON public.leads
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('master_br', 'admin'))
);

-- Admin: pode tudo
CREATE POLICY "admin_manage_all_leads" ON public.leads
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Fazer o mesmo para deals e activities
-- DEALS
DROP POLICY IF EXISTS "city users read own city - deals" ON public.deals;
DROP POLICY IF EXISTS "city users write own city - deals" ON public.deals;
DROP POLICY IF EXISTS "city users update own city - deals" ON public.deals;
DROP POLICY IF EXISTS "admin all - deals" ON public.deals;

CREATE POLICY "regional_manage_city_deals" ON public.deals
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'regional' AND city_id = deals.city_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'regional' AND city_id = deals.city_id)
);

CREATE POLICY "franchisee_manage_own_deals" ON public.deals
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.app_users au
    JOIN public.franchisees f ON au.franchisee_id = f.id
    WHERE au.id = auth.uid() AND au.role = 'franchisee' AND f.city_id = deals.city_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users au
    JOIN public.franchisees f ON au.franchisee_id = f.id
    WHERE au.id = auth.uid() AND au.role = 'franchisee' AND f.city_id = deals.city_id
  )
);

CREATE POLICY "master_br_read_all_deals" ON public.deals
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('master_br', 'admin'))
);

CREATE POLICY "admin_manage_all_deals" ON public.deals
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
);

-- ACTIVITIES
DROP POLICY IF EXISTS "city users read own city - activities" ON public.activities;
DROP POLICY IF EXISTS "city users write own city - activities" ON public.activities;
DROP POLICY IF EXISTS "city users update own city - activities" ON public.activities;
DROP POLICY IF EXISTS "admin all - activities" ON public.activities;

CREATE POLICY "regional_manage_city_activities" ON public.activities
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'regional' AND city_id = activities.city_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'regional' AND city_id = activities.city_id)
);

CREATE POLICY "franchisee_manage_own_activities" ON public.activities
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.app_users au
    JOIN public.franchisees f ON au.franchisee_id = f.id
    WHERE au.id = auth.uid() AND au.role = 'franchisee' AND f.city_id = activities.city_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users au
    JOIN public.franchisees f ON au.franchisee_id = f.id
    WHERE au.id = auth.uid() AND au.role = 'franchisee' AND f.city_id = activities.city_id
  )
);

CREATE POLICY "master_br_read_all_activities" ON public.activities
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('master_br', 'admin'))
);

CREATE POLICY "admin_manage_all_activities" ON public.activities
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
);

-- Verificar políticas criadas
SELECT 'Políticas atualizadas com sucesso!' as status;