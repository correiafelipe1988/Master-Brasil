-- ============================================================
-- Sistema de Templates de Contratos - Master Brasil
-- ============================================================

-- 1. Tabela para tipos de contratos
CREATE TABLE IF NOT EXISTS public.contract_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL, -- 'rental', 'sale', 'service', 'partnership', etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela para templates de contratos
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_type_id UUID NOT NULL REFERENCES public.contract_types(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  title TEXT NOT NULL, -- Título que aparece no PDF
  content JSONB NOT NULL, -- Estrutura do contrato em JSON
  variables JSONB NOT NULL DEFAULT '[]', -- Variáveis dinâmicas
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false, -- Template padrão para o tipo
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(contract_type_id, name, version)
);

-- 3. Tabela para cláusulas contratuais
CREATE TABLE IF NOT EXISTS public.contract_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.contract_templates(id) ON DELETE CASCADE,
  clause_number TEXT NOT NULL, -- Ex: "1", "1.1", "12.7"
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  variables JSONB DEFAULT '[]', -- Variáveis específicas da cláusula
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(template_id, clause_number)
);

-- 4. Tabela para contratos gerados
CREATE TABLE IF NOT EXISTS public.generated_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.contract_templates(id) ON DELETE RESTRICT,
  rental_id UUID REFERENCES public.rentals(id) ON DELETE SET NULL,
  contract_number TEXT NOT NULL UNIQUE,
  contract_data JSONB NOT NULL, -- Dados preenchidos do contrato
  pdf_url TEXT, -- URL do PDF gerado
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent', 'signed', 'cancelled')),
  signature_request_id TEXT, -- ID da solicitação de assinatura
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_contract_templates_type ON public.contract_templates(contract_type_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON public.contract_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_contract_clauses_template ON public.contract_clauses(template_id);
CREATE INDEX IF NOT EXISTS idx_contract_clauses_order ON public.contract_clauses(template_id, order_index);
CREATE INDEX IF NOT EXISTS idx_generated_contracts_template ON public.generated_contracts(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_contracts_rental ON public.generated_contracts(rental_id);
CREATE INDEX IF NOT EXISTS idx_generated_contracts_city ON public.generated_contracts(city_id);
CREATE INDEX IF NOT EXISTS idx_generated_contracts_status ON public.generated_contracts(status);

-- 6. RLS Policies
ALTER TABLE public.contract_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_contracts ENABLE ROW LEVEL SECURITY;

-- Policies para contract_types (todos podem ler, apenas admin pode modificar)
DROP POLICY IF EXISTS "contract_types_read" ON public.contract_types;
CREATE POLICY "contract_types_read" ON public.contract_types
FOR SELECT USING (true);

DROP POLICY IF EXISTS "contract_types_admin" ON public.contract_types;
CREATE POLICY "contract_types_admin" ON public.contract_types
FOR ALL USING (public.jwt_role() = 'admin')
WITH CHECK (public.jwt_role() = 'admin');

-- Policies para contract_templates (todos podem ler, apenas admin pode modificar)
DROP POLICY IF EXISTS "contract_templates_read" ON public.contract_templates;
CREATE POLICY "contract_templates_read" ON public.contract_templates
FOR SELECT USING (true);

DROP POLICY IF EXISTS "contract_templates_admin" ON public.contract_templates;
CREATE POLICY "contract_templates_admin" ON public.contract_templates
FOR ALL USING (public.jwt_role() = 'admin')
WITH CHECK (public.jwt_role() = 'admin');

-- Policies para contract_clauses (todos podem ler, apenas admin pode modificar)
DROP POLICY IF EXISTS "contract_clauses_read" ON public.contract_clauses;
CREATE POLICY "contract_clauses_read" ON public.contract_clauses
FOR SELECT USING (true);

DROP POLICY IF EXISTS "contract_clauses_admin" ON public.contract_clauses;
CREATE POLICY "contract_clauses_admin" ON public.contract_clauses
FOR ALL USING (public.jwt_role() = 'admin')
WITH CHECK (public.jwt_role() = 'admin');

-- Policies para generated_contracts (por cidade)
DROP POLICY IF EXISTS "generated_contracts_city_read" ON public.generated_contracts;
CREATE POLICY "generated_contracts_city_read" ON public.generated_contracts
FOR SELECT USING (
  public.jwt_role() = 'admin' OR 
  city_id = public.jwt_city_id()
);

DROP POLICY IF EXISTS "generated_contracts_city_write" ON public.generated_contracts;
CREATE POLICY "generated_contracts_city_write" ON public.generated_contracts
FOR INSERT WITH CHECK (
  public.jwt_role() = 'admin' OR 
  city_id = public.jwt_city_id()
);

DROP POLICY IF EXISTS "generated_contracts_city_update" ON public.generated_contracts;
CREATE POLICY "generated_contracts_city_update" ON public.generated_contracts
FOR UPDATE USING (
  public.jwt_role() = 'admin' OR 
  city_id = public.jwt_city_id()
) WITH CHECK (
  public.jwt_role() = 'admin' OR 
  city_id = public.jwt_city_id()
);

-- 7. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_contract_types_updated_at ON public.contract_types;
CREATE TRIGGER update_contract_types_updated_at
    BEFORE UPDATE ON public.contract_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contract_templates_updated_at ON public.contract_templates;
CREATE TRIGGER update_contract_templates_updated_at
    BEFORE UPDATE ON public.contract_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_generated_contracts_updated_at ON public.generated_contracts;
CREATE TRIGGER update_generated_contracts_updated_at
    BEFORE UPDATE ON public.generated_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
