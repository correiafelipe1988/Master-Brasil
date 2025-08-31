-- ============================================================
-- Criar tabela motorcycles com sistema de RLS
-- ============================================================

-- 1. Verificar se tabela já existe
SELECT 'Verificando se tabela motorcycles já existe...' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'motorcycles';

-- 2. Criar tabela motorcycles
CREATE TABLE IF NOT EXISTS public.motorcycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa VARCHAR(8) NOT NULL, -- Placa da moto (ABC-1234 ou ABC1D23)
  modelo TEXT NOT NULL, -- Modelo da motocicleta
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN (
      'active', 
      'alugada', 
      'relocada', 
      'manutencao', 
      'recolhida', 
      'indisponivel_rastreador', 
      'indisponivel_emplacamento'
    )
  ),
  data_ultima_mov TIMESTAMPTZ, -- Data da última movimentação
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Data de criação do registro
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT, -- Cidade onde a moto está localizada
  franchisee_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL, -- Franqueado responsável pela moto
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_motorcycles_placa ON public.motorcycles(placa);
CREATE INDEX IF NOT EXISTS idx_motorcycles_status ON public.motorcycles(status);
CREATE INDEX IF NOT EXISTS idx_motorcycles_city_id ON public.motorcycles(city_id);
CREATE INDEX IF NOT EXISTS idx_motorcycles_franchisee_id ON public.motorcycles(franchisee_id);
CREATE INDEX IF NOT EXISTS idx_motorcycles_data_ultima_mov ON public.motorcycles(data_ultima_mov);

-- 4. Habilitar RLS na tabela
ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS para diferentes roles

-- Admin: pode tudo
CREATE POLICY "admin_manage_all_motorcycles" ON public.motorcycles
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
);

-- Master_br: pode ler todas as motos (read-only global)
CREATE POLICY "master_br_read_all_motorcycles" ON public.motorcycles
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('master_br', 'admin'))
);

-- Regional: pode gerenciar motos da sua cidade
CREATE POLICY "regional_manage_city_motorcycles" ON public.motorcycles
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

-- Franchisee: pode gerenciar apenas suas próprias motos na sua cidade
CREATE POLICY "franchisee_manage_own_motorcycles" ON public.motorcycles
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

-- 6. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_motorcycles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_motorcycles_updated_at_trigger ON public.motorcycles;
CREATE TRIGGER update_motorcycles_updated_at_trigger
  BEFORE UPDATE ON public.motorcycles
  FOR EACH ROW
  EXECUTE FUNCTION update_motorcycles_updated_at();

-- 8. Inserir dados de exemplo para teste (opcional)
INSERT INTO public.motorcycles (placa, modelo, status, city_id, data_ultima_mov)
SELECT 
  'ABC1234' as placa,
  'Honda CG 160 Start' as modelo,
  'active' as status,
  c.id as city_id,
  NOW() - INTERVAL '2 days' as data_ultima_mov
FROM public.cities c 
WHERE c.slug = 'salvador'
AND NOT EXISTS (
  SELECT 1 FROM public.motorcycles WHERE placa = 'ABC1234'
)
LIMIT 1;

INSERT INTO public.motorcycles (placa, modelo, status, city_id, data_ultima_mov)
SELECT 
  'XYZ5678' as placa,
  'Yamaha Factor 125' as modelo,
  'alugada' as status,
  c.id as city_id,
  NOW() - INTERVAL '1 hour' as data_ultima_mov
FROM public.cities c 
WHERE c.slug = 'salvador'
AND NOT EXISTS (
  SELECT 1 FROM public.motorcycles WHERE placa = 'XYZ5678'
)
LIMIT 1;

INSERT INTO public.motorcycles (placa, modelo, status, city_id, data_ultima_mov)
SELECT 
  'DEF9101' as placa,
  'Honda CG 160 Cargo' as modelo,
  'manutencao' as status,
  c.id as city_id,
  NOW() - INTERVAL '5 days' as data_ultima_mov
FROM public.cities c 
WHERE c.slug = 'rio-de-janeiro'
AND NOT EXISTS (
  SELECT 1 FROM public.motorcycles WHERE placa = 'DEF9101'
)
LIMIT 1;

-- 9. Verificar resultado
SELECT 'Tabela motorcycles criada com sucesso!' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'motorcycles';

SELECT 'Políticas RLS criadas:' as info;
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'motorcycles'
ORDER BY cmd, policyname;

SELECT 'Dados de exemplo inseridos:' as info;
SELECT COUNT(*) as total_motorcycles FROM public.motorcycles;
SELECT placa, modelo, status FROM public.motorcycles LIMIT 5;