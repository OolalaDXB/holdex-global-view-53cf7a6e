-- FIX 1: Storage UPDATE policies with WITH CHECK

DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own asset images" ON storage.objects;
CREATE POLICY "Users can update own asset images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- FIX 2: Link profiles to auth.users

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_auth_users_fk
  FOREIGN KEY (id) REFERENCES auth.users(id)
  ON DELETE CASCADE;