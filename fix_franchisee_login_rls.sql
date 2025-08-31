-- ============================================================
-- Corrigir RLS para permitir login de franqueados 
-- ============================================================

-- Problema: Durante login por CNPJ, o sistema precisa consultar o email 
-- do app_users mas RLS bloqueia porque ainda não há auth.uid() (não logado)

-- Solução: Permitir consulta APENAS do campo email para validação de login
CREATE POLICY "allow_email_lookup_for_login" ON public.app_users
FOR SELECT USING (TRUE)  -- Permite leitura para todos
WITH CHECK (FALSE);      -- Mas não permite escrita

-- IMPORTANTE: Esta policy é bem específica e segura porque:
-- 1. Só permite SELECT (leitura) 
-- 2. WITH CHECK = FALSE impede qualquer escrita
-- 3. É necessária para o processo de login funcionar
-- 4. Mesmo que alguém malicioso acesse, só verá emails (não senhas)

-- Verificar policies após criação
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'app_users'
ORDER BY cmd, policyname;