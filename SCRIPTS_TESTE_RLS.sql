-- 🧪 SCRIPTS DE TESTE RLS - VERIFICAÇÃO DE SEGURANÇA
-- Data: 2025-01-03
-- Objetivo: Testar se as políticas RLS estão funcionando corretamente

-- ============================================================================
-- 1. VERIFICAR STATUS RLS DAS TABELAS
-- ============================================================================

-- Verificar quais tabelas têm RLS habilitado
SELECT
  tablename,
  rowsecurity as rls_enabled,
  CASE
    WHEN rowsecurity THEN '✅ HABILITADO'
    ELSE '❌ DESABILITADO'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. VERIFICAR POLÍTICAS EXISTENTES
-- ============================================================================

-- Listar todas as políticas por tabela
SELECT
  tablename,
  policyname,
  cmd as operacao,
  CASE
    WHEN cmd = 'ALL' THEN '🔓 TODAS'
    WHEN cmd = 'SELECT' THEN '👁️ LEITURA'
    WHEN cmd = 'INSERT' THEN '➕ INSERÇÃO'
    WHEN cmd = 'UPDATE' THEN '✏️ ATUALIZAÇÃO'
    WHEN cmd = 'DELETE' THEN '🗑️ EXCLUSÃO'
  END as tipo_operacao
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
