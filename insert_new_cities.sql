-- ============================================================
-- Inserir novas cidades na tabela cities
-- ============================================================

-- 1. Verificar cidades existentes
SELECT 'Cidades existentes antes da inserção:' as info;
SELECT id, slug, name FROM public.cities ORDER BY name;

-- 2. Inserir novas cidades (usando UPSERT para evitar duplicatas)
INSERT INTO public.cities (slug, name) VALUES
  ('floresta', 'Floresta'),
  ('caninde', 'Canindé'),
  ('copacabana', 'Copacabana'),
  ('sao-luiz-do-maranhao', 'São Luiz do Maranhão'),
  ('locagora-caete', 'Locagora Caeté'),
  ('sp-imr-company', 'SP – IMR Company'),
  -- Salvador já existe
  ('freguesia-do-o', 'Freguesia do Ó'),
  ('teresina', 'Teresina'),
  -- Brasília já existe
  ('limao', 'Limão'),
  -- Fortaleza já existe
  ('recife', 'Recife'),
  ('ribeirao-preto', 'Ribeirão Preto'),
  ('joinville', 'Joinville'),
  ('tatuape', 'Tatuapé'),
  ('maceio', 'Maceió'),
  ('joao-pessoa', 'João Pessoa'),
  ('braganca-paulista', 'Bragança Paulista'),
  ('porto-alegre', 'Porto Alegre'),
  ('goiania', 'Goiânia'),
  ('curitiba', 'Curitiba'),
  ('barueri', 'Barueri')
ON CONFLICT (slug) DO NOTHING;

-- 3. Verificar resultado da inserção
SELECT 'Resultado da inserção:' as info;
SELECT COUNT(*) as total_cidades_inseridas 
FROM public.cities 
WHERE slug IN (
  'floresta', 'caninde', 'copacabana', 'sao-luiz-do-maranhao', 'locagora-caete',
  'sp-imr-company', 'freguesia-do-o', 'teresina', 'limao', 'recife',
  'ribeirao-preto', 'joinville', 'tatuape', 'maceio', 'joao-pessoa',
  'braganca-paulista', 'porto-alegre', 'goiania', 'curitiba', 'barueri'
);

-- 4. Listar todas as cidades após inserção
SELECT 'Todas as cidades após inserção:' as info;
SELECT id, slug, name, created_at 
FROM public.cities 
ORDER BY name;

-- 5. Verificar especificamente as novas cidades inseridas
SELECT 'Novas cidades inseridas nesta operação:' as info;
SELECT id, slug, name, created_at 
FROM public.cities 
WHERE slug IN (
  'floresta', 'caninde', 'copacabana', 'sao-luiz-do-maranhao', 'locagora-caete',
  'sp-imr-company', 'freguesia-do-o', 'teresina', 'limao', 'recife',
  'ribeirao-preto', 'joinville', 'tatuape', 'maceio', 'joao-pessoa',
  'braganca-paulista', 'porto-alegre', 'goiania', 'curitiba', 'barueri'
)
ORDER BY name;

-- 6. Estatísticas finais
SELECT 'Estatísticas finais:' as info;
SELECT 
  COUNT(*) as total_cidades,
  COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as inseridas_hoje
FROM public.cities;

SELECT 'Script executado com sucesso!' as status;
