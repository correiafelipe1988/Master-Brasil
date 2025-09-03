-- ============================================================
-- Script de Setup Completo do Sistema de Contratos
-- Execute este script no Supabase para configurar o sistema
-- ============================================================

-- 1. Executar criação das tabelas
\i create_contract_templates_system.sql

-- 2. Inserir dados do template de locação de motocicletas
\i insert_motorcycle_rental_template.sql

-- 3. Verificar se tudo foi criado corretamente
SELECT 'Verificando criação das tabelas...' as status;

SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'contract_types',
    'contract_templates', 
    'contract_clauses',
    'generated_contracts'
  )
ORDER BY table_name;

SELECT 'Verificando tipos de contratos...' as status;
SELECT * FROM public.contract_types;

SELECT 'Verificando templates...' as status;
SELECT 
  ct.name as template_name,
  ct.version,
  cty.name as contract_type,
  ct.is_active,
  ct.is_default
FROM public.contract_templates ct
JOIN public.contract_types cty ON ct.contract_type_id = cty.id;

SELECT 'Verificando cláusulas...' as status;
SELECT 
  cc.clause_number,
  cc.title,
  LENGTH(cc.content) as content_length,
  cc.order_index
FROM public.contract_clauses cc
JOIN public.contract_templates ct ON cc.template_id = ct.id
WHERE ct.name = 'Contrato Padrão de Locação de Motocicletas'
ORDER BY cc.order_index;

SELECT 'Setup do sistema de contratos concluído!' as status;
