-- ============================================================
-- SOLUÇÃO TEMPORÁRIA: Desabilitar RLS para permitir cadastro franchisee
-- EXECUTE ESTE SQL NO PAINEL DO SUPABASE
-- ============================================================

-- 1. Desabilitar temporariamente RLS em app_users
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;

-- 2. Verificar que RLS foi desabilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'app_users' AND schemaname = 'public';

-- ============================================================
-- DEPOIS DE TESTAR O CADASTRO, EXECUTE ESTE BLOCO PARA REABILITAR:
-- ============================================================

-- REABILITAR RLS (execute depois do teste):
-- ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- INSTRUCOES:
-- 1. Execute a primeira parte (DISABLE)
-- 2. Teste o cadastro de franqueado no seu app
-- 3. Se funcionar, execute a segunda parte (ENABLE)
-- 4. Depois podemos trabalhar numa solução de policies mais elegante
-- ============================================================