-- ============================================================
-- Setup do Bucket de Storage para Contratos - Master Brasil
-- Execute este script no Supabase para configurar o storage
-- ============================================================

-- 1. Criar bucket para contratos (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política para permitir upload de contratos
CREATE POLICY "Authenticated users can upload contracts" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contracts');

-- 3. Política para permitir visualização de contratos
CREATE POLICY "Authenticated users can view contracts" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'contracts');

-- 4. Política para permitir atualização de contratos
CREATE POLICY "Authenticated users can update contracts" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'contracts');

-- 5. Política para permitir exclusão de contratos (apenas admins)
CREATE POLICY "Only admins can delete contracts" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'contracts' 
  AND EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 6. Verificar se o bucket foi criado
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'contracts';

-- 7. Verificar políticas criadas
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%contract%';

SELECT 'Setup do bucket de storage concluído!' as status;
