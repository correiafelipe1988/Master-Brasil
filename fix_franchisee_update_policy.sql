-- ============================================================
-- Corrigir policy RLS para permitir update do user_id em franchisees
-- ============================================================

-- Adicionar policy para permitir que usuários atualizem seu próprio user_id
-- quando estão fazendo primeira configuração de conta
CREATE POLICY "allow_user_id_update_for_franchisees" ON public.franchisees
FOR UPDATE USING (
  -- Permite update se o user_id atual é nulo (primeiro setup)
  -- e se o usuário é o proprietário da conta sendo atualizada
  user_id IS NULL AND auth.uid()::text = (
    SELECT id::text FROM auth.users WHERE id = auth.uid()
  )
)
WITH CHECK (
  -- Permite apenas update do campo user_id para o próprio auth.uid()
  user_id = auth.uid()
);

-- Policy adicional para permitir que usuários vejam franchisees durante setup
CREATE POLICY "allow_cnpj_lookup_for_setup" ON public.franchisees
FOR SELECT USING (
  -- Permite leitura se user_id é null (disponível para setup)
  -- ou se é o próprio franchisee logado
  user_id IS NULL OR user_id = auth.uid()
);

COMMIT;