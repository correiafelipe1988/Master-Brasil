-- Criação da tabela de vendas de motos
-- Executa este script no SQL Editor do Supabase para criar a tabela vendas

-- Criar tabela vendas
CREATE TABLE IF NOT EXISTS public.vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_compra date NOT NULL,
  parceiro text NOT NULL,
  status text NOT NULL CHECK (status IN ('PAGO', 'PAGANDO', 'PENDENTE')),
  entregue boolean NOT NULL DEFAULT false,
  franqueado text NOT NULL,
  cnpj text NOT NULL,
  razao_social text NOT NULL,
  quantidade integer NOT NULL CHECK (quantidade > 0),
  marca text NOT NULL,
  modelo text NOT NULL,
  valor_unitario numeric(12,2) NOT NULL CHECK (valor_unitario >= 0),
  valor_total numeric(12,2) NOT NULL CHECK (valor_total >= 0),
  city_id uuid REFERENCES public.cities(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_vendas_city_id ON public.vendas(city_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data_compra ON public.vendas(data_compra);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON public.vendas(status);
CREATE INDEX IF NOT EXISTS idx_vendas_parceiro ON public.vendas(parceiro);
CREATE INDEX IF NOT EXISTS idx_vendas_marca ON public.vendas(marca);

-- Criar trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_vendas_updated_at ON public.vendas;
CREATE TRIGGER trg_vendas_updated_at
    BEFORE UPDATE ON public.vendas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Criar função específica para vendas se necessário
CREATE OR REPLACE FUNCTION public.set_city_id_vendas()
RETURNS TRIGGER AS $$
BEGIN
  -- Se city_id não foi fornecido e o usuário tem city_id no JWT, usar esse valor
  IF NEW.city_id IS NULL AND auth.jwt() ->> 'city_id' IS NOT NULL THEN
    NEW.city_id := (auth.jwt() ->> 'city_id')::uuid;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Aplicar trigger para city_id
DROP TRIGGER IF EXISTS trg_set_city_id_vendas ON public.vendas;
CREATE TRIGGER trg_set_city_id_vendas
BEFORE INSERT OR UPDATE ON public.vendas
FOR EACH ROW EXECUTE FUNCTION public.set_city_id_vendas();

-- Habilitar RLS
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- Policies de RLS para vendas
-- Admin e Master BR: podem ver todas as vendas
DROP POLICY IF EXISTS "admin_master_all_vendas" ON public.vendas;
CREATE POLICY "admin_master_all_vendas" ON public.vendas
FOR ALL USING (
  auth.jwt() ->> 'role' IN ('admin', 'master_br')
);

-- Regional: pode ver apenas vendas de sua cidade
DROP POLICY IF EXISTS "regional_own_city_vendas" ON public.vendas;
CREATE POLICY "regional_own_city_vendas" ON public.vendas
FOR ALL USING (
  auth.jwt() ->> 'role' = 'regional' 
  AND city_id = (auth.jwt() ->> 'city_id')::uuid
);

-- Franqueados: não podem acessar vendas
-- (sem policy = sem acesso)

-- Inserir alguns dados de exemplo
INSERT INTO public.vendas (
  data_compra, parceiro, status, entregue, franqueado, cnpj, razao_social,
  quantidade, marca, modelo, valor_unitario, valor_total, city_id
) VALUES 
(
  '2025-05-23', 'HABBYZUCA', 'PAGO', true, 'Fernando Maia Rezende',
  '59.621.282/0001-97', 'CG MOTOS LTDA', 5, 'Shineray',
  'SHI175cc - Injetada', 16900.00, 84500.00,
  (SELECT id FROM public.cities LIMIT 1)
),
(
  '2025-01-23', 'MEGA', 'PAGO', true, 'Wilson Rezende Ribeiro Júnior',
  '59.935.205/0001-49', 'H4S SERVIÇOS DE LOCAÇÕES DE MOTOS LTDA', 8, 'Shineray',
  'SHI175cc - Carburada', 14400.00, 115200.00,
  (SELECT id FROM public.cities LIMIT 1)
),
(
  '2025-05-05', 'MEGA', 'PAGANDO', true, 'José Alves Nascimento Filho',
  '03.268.997/0001-53', 'REALIZAR LOCAÇÃO DE AUTOMOVEIS LTDA', 6, 'Dafra',
  'NH190cc - Injetada', 19990.00, 119940.00,
  (SELECT id FROM public.cities LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- Verificar se a tabela foi criada com sucesso
SELECT 'Tabela vendas criada com sucesso!' as status;