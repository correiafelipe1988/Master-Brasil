-- Criação da tabela de planos de locação (rental_plans)
-- Execute este script no SQL Editor do Supabase para criar a tabela rental_plans

-- Criar tabela rental_plans
CREATE TABLE IF NOT EXISTS public.rental_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações do plano
  name TEXT NOT NULL,
  description TEXT,
  
  -- Valores e limites
  daily_rate NUMERIC(12,2) NOT NULL CHECK (daily_rate >= 0),
  minimum_days INTEGER NOT NULL DEFAULT 1 CHECK (minimum_days > 0),
  maximum_days INTEGER CHECK (maximum_days IS NULL OR maximum_days >= minimum_days),
  
  -- Referência à cidade
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
  
  -- Status do plano
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_rental_plans_city_id ON public.rental_plans(city_id);
CREATE INDEX IF NOT EXISTS idx_rental_plans_status ON public.rental_plans(status);
CREATE INDEX IF NOT EXISTS idx_rental_plans_daily_rate ON public.rental_plans(daily_rate);
CREATE INDEX IF NOT EXISTS idx_rental_plans_created_at ON public.rental_plans(created_at);

-- Habilitar RLS na tabela
ALTER TABLE public.rental_plans ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para diferentes roles
-- Política para admins (acesso total)
CREATE POLICY "Admins can do everything on rental_plans" ON public.rental_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para city_users (apenas da sua cidade)
CREATE POLICY "City users can manage rental_plans in their city" ON public.rental_plans
  FOR ALL USING (
    city_id = public.jwt_city_id()
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_rental_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_rental_plans_updated_at 
  BEFORE UPDATE ON public.rental_plans 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_rental_plans_updated_at();

-- Inserir alguns planos de exemplo
INSERT INTO public.rental_plans (name, description, daily_rate, minimum_days, maximum_days, city_id)
SELECT 
  'Plano Básico',
  'Plano básico de locação diária',
  50.00,
  1,
  30,
  c.id
FROM public.cities c
WHERE c.slug = 'salvador'
ON CONFLICT DO NOTHING;

INSERT INTO public.rental_plans (name, description, daily_rate, minimum_days, maximum_days, city_id)
SELECT 
  'Plano Semanal',
  'Plano semanal com desconto',
  45.00,
  7,
  30,
  c.id
FROM public.cities c
WHERE c.slug = 'salvador'
ON CONFLICT DO NOTHING;

INSERT INTO public.rental_plans (name, description, daily_rate, minimum_days, maximum_days, city_id)
SELECT 
  'Plano Mensal',
  'Plano mensal com maior desconto',
  40.00,
  30,
  NULL,
  c.id
FROM public.cities c
WHERE c.slug = 'salvador'
ON CONFLICT DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE public.rental_plans IS 'Tabela para armazenar planos de locação de motocicletas';
COMMENT ON COLUMN public.rental_plans.name IS 'Nome do plano de locação';
COMMENT ON COLUMN public.rental_plans.description IS 'Descrição detalhada do plano';
COMMENT ON COLUMN public.rental_plans.daily_rate IS 'Valor da diária do plano';
COMMENT ON COLUMN public.rental_plans.minimum_days IS 'Número mínimo de dias para este plano';
COMMENT ON COLUMN public.rental_plans.maximum_days IS 'Número máximo de dias para este plano (NULL = sem limite)';
COMMENT ON COLUMN public.rental_plans.status IS 'Status do plano: active, inactive';
