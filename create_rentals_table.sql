-- Criação da tabela de locações (rentals)
-- Execute este script no SQL Editor do Supabase para criar a tabela rentals

-- Criar tabela rentals
CREATE TABLE IF NOT EXISTS public.rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados do cliente
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_document TEXT NOT NULL, -- CPF/CNPJ
  
  -- Referências
  motorcycle_id UUID NOT NULL REFERENCES public.motorcycles(id) ON DELETE RESTRICT,
  franchisee_id UUID NOT NULL REFERENCES public.franchisees(id) ON DELETE RESTRICT,
  plan_id UUID NOT NULL REFERENCES public.rental_plans(id) ON DELETE RESTRICT,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
  
  -- Datas e período
  start_date DATE NOT NULL,
  end_date DATE, -- Pode ser NULL para locações em aberto
  total_days INTEGER NOT NULL CHECK (total_days > 0),
  
  -- Valores
  daily_rate NUMERIC(12,2) NOT NULL CHECK (daily_rate >= 0),
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  
  -- Status da locação
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  
  -- Quilometragem
  km_inicial INTEGER DEFAULT 0,
  km_final INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_rentals_client_document ON public.rentals(client_document);
CREATE INDEX IF NOT EXISTS idx_rentals_motorcycle_id ON public.rentals(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_rentals_franchisee_id ON public.rentals(franchisee_id);
CREATE INDEX IF NOT EXISTS idx_rentals_plan_id ON public.rentals(plan_id);
CREATE INDEX IF NOT EXISTS idx_rentals_city_id ON public.rentals(city_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON public.rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_start_date ON public.rentals(start_date);
CREATE INDEX IF NOT EXISTS idx_rentals_end_date ON public.rentals(end_date);
CREATE INDEX IF NOT EXISTS idx_rentals_created_at ON public.rentals(created_at);

-- Habilitar RLS na tabela
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para diferentes roles
-- Política para admins (acesso total)
CREATE POLICY "Admins can do everything on rentals" ON public.rentals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para city_users (apenas da sua cidade)
CREATE POLICY "City users can manage rentals in their city" ON public.rentals
  FOR ALL USING (
    city_id = public.jwt_city_id()
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_rentals_updated_at 
  BEFORE UPDATE ON public.rentals 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.rentals IS 'Tabela para armazenar informações das locações de motocicletas';
COMMENT ON COLUMN public.rentals.client_name IS 'Nome completo do cliente';
COMMENT ON COLUMN public.rentals.client_document IS 'CPF ou CNPJ do cliente';
COMMENT ON COLUMN public.rentals.motorcycle_id IS 'Referência para a motocicleta alugada';
COMMENT ON COLUMN public.rentals.franchisee_id IS 'Referência para o franqueado responsável';
COMMENT ON COLUMN public.rentals.plan_id IS 'Referência para o plano de locação';
COMMENT ON COLUMN public.rentals.total_days IS 'Número total de dias da locação';
COMMENT ON COLUMN public.rentals.daily_rate IS 'Valor da diária no momento da locação';
COMMENT ON COLUMN public.rentals.total_amount IS 'Valor total da locação';
COMMENT ON COLUMN public.rentals.status IS 'Status da locação: active, completed, cancelled';
COMMENT ON COLUMN public.rentals.km_inicial IS 'Quilometragem inicial da motocicleta';
COMMENT ON COLUMN public.rentals.km_final IS 'Quilometragem final da motocicleta';
