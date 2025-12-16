-- ============================================
-- FINAL SECURITY FIXES BEFORE MIGRATION
-- ============================================

-- FIX 1: Remove public storage policy (CRITICAL)
DROP POLICY IF EXISTS "Public read access for asset images" ON storage.objects;

-- FIX 2: Fix check_circular_ownership() with tenant scope
CREATE OR REPLACE FUNCTION public.check_circular_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_id UUID;
  visited_ids UUID[];
BEGIN
  IF NEW.owned_by_entity_id IS NULL THEN
    RETURN NEW;
  END IF;

  current_id := NEW.owned_by_entity_id;
  visited_ids := ARRAY[NEW.id];

  WHILE current_id IS NOT NULL LOOP
    IF current_id = ANY(visited_ids) THEN
      RAISE EXCEPTION 'Circular ownership detected';
    END IF;

    visited_ids := array_append(visited_ids, current_id);

    SELECT owned_by_entity_id INTO current_id
    FROM public.entities
    WHERE id = current_id
      AND user_id = NEW.user_id;  -- tenant scope added
  END LOOP;

  RETURN NEW;
END;
$$;

-- FIX 3: Add TO authenticated to all storage policies
-- Documents bucket
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Asset-images bucket
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

CREATE POLICY "Users can view own images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);