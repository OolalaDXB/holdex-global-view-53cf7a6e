-- Add image_url column to assets table
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url column to collections table
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for asset images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'asset-images', 
  'asset-images', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'asset-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'asset-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'asset-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public read access for asset images"
ON storage.objects FOR SELECT
USING (bucket_id = 'asset-images');