-- ============================================================
-- Expandir Sistema: city_user → regional + master_br + franchisee
-- ============================================================

-- 1. Ver estrutura atual
SELECT role, COUNT(*) as quantidade FROM public.app_users GROUP BY role;

-- 2. Criar tabela para franqueados
CREATE TABLE IF NOT EXISTS public.franchisees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj VARCHAR(14) UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  fantasy_name TEXT,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Adicionar coluna franchisee_id na app_users
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS franchisee_id UUID REFERENCES public.franchisees(id) ON DELETE SET NULL;

-- 4. Atualizar constraint de roles (remover antiga e criar nova)
ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
ALTER TABLE public.app_users ADD CONSTRAINT app_users_role_check 
CHECK (role IN ('admin', 'master_br', 'regional', 'franchisee'));

-- 5. Migrar city_user → regional (manter funcionamento atual)
UPDATE public.app_users SET role = 'regional' WHERE role = 'city_user';

-- 6. Verificar migração
SELECT 'Após migração:' as info;
SELECT role, COUNT(*) as quantidade FROM public.app_users GROUP BY role;

-- 7. Habilitar RLS na nova tabela
ALTER TABLE public.franchisees ENABLE ROW LEVEL SECURITY;

-- 8. Atualizar policies do app_users para suportar novos roles
DROP POLICY IF EXISTS "user_manage_own_record" ON public.app_users;
DROP POLICY IF EXISTS "admin_full_access" ON public.app_users;

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

-- 9. Policies para franchisees
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

-- 10. Atualizar policies de leads para nova hierarquia
DROP POLICY IF EXISTS "city users read own city - leads" ON public.leads;
DROP POLICY IF EXISTS "city users write own city - leads" ON public.leads;
DROP POLICY IF EXISTS "city users update own city - leads" ON public.leads;
DROP POLICY IF EXISTS "admin all - leads" ON public.leads;

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

-- 11. Fazer o mesmo para deals e activities (copiar mesma lógica)
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

-- 12. Índices para performance
CREATE INDEX IF NOT EXISTS idx_franchisees_cnpj ON public.franchisees(cnpj);
CREATE INDEX IF NOT EXISTS idx_franchisees_city_id ON public.franchisees(city_id);
CREATE INDEX IF NOT EXISTS idx_app_users_franchisee_id ON public.app_users(franchisee_id);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON public.app_users(role);

-- 13. Verificar resultado final
SELECT 'Estrutura final:' as info;
SELECT role, COUNT(*) as quantidade FROM public.app_users GROUP BY role;

SELECT 'Tabelas criadas:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'franchisees';