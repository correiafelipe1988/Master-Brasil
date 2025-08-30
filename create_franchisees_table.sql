-- ============================================================
-- Criar tabela franchisees e expandir sistema de roles
-- ============================================================

-- 1. Criar tabela para franqueados
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

-- 2. Adicionar coluna franchisee_id na app_users
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS franchisee_id UUID REFERENCES public.franchisees(id) ON DELETE SET NULL;

-- 3. Atualizar constraint de roles (remover antiga e criar nova)
ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
ALTER TABLE public.app_users ADD CONSTRAINT app_users_role_check 
CHECK (role IN ('admin', 'master_br', 'regional', 'franchisee'));

-- 4. Migrar city_user → regional (manter funcionamento atual)
UPDATE public.app_users SET role = 'regional' WHERE role = 'city_user';

-- 5. Habilitar RLS na nova tabela
ALTER TABLE public.franchisees ENABLE ROW LEVEL SECURITY;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_franchisees_cnpj ON public.franchisees(cnpj);
CREATE INDEX IF NOT EXISTS idx_franchisees_city_id ON public.franchisees(city_id);
CREATE INDEX IF NOT EXISTS idx_app_users_franchisee_id ON public.app_users(franchisee_id);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON public.app_users(role);

-- 7. Verificar resultado
SELECT 'Estrutura criada:' as info;
SELECT role, COUNT(*) as quantidade FROM public.app_users GROUP BY role;

SELECT 'Tabela franchisees criada:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'franchisees';