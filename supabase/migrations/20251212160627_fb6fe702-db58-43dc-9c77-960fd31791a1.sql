-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('title_deed', 'contract', 'invoice', 'passport', 'tax_return', 'statement', 'insurance', 'valuation', 'certificate', 'other')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size <= 10485760), -- 10MB max
  file_type TEXT NOT NULL,
  
  -- Links (at least one required via constraint)
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
  liability_id UUID REFERENCES public.liabilities(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  receivable_id UUID REFERENCES public.receivables(id) ON DELETE CASCADE,
  
  document_date DATE,
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT false,
  verification_date DATE,
  notes TEXT,
  tags TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraint: at least one link must be set
  CONSTRAINT at_least_one_link CHECK (
    asset_id IS NOT NULL OR 
    collection_id IS NOT NULL OR 
    liability_id IS NOT NULL OR 
    entity_id IS NOT NULL OR 
    receivable_id IS NOT NULL
  )
);

-- Create indexes
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_asset_id ON public.documents(asset_id);
CREATE INDEX idx_documents_collection_id ON public.documents(collection_id);
CREATE INDEX idx_documents_liability_id ON public.documents(liability_id);
CREATE INDEX idx_documents_entity_id ON public.documents(entity_id);
CREATE INDEX idx_documents_receivable_id ON public.documents(receivable_id);
CREATE INDEX idx_documents_expiry_date ON public.documents(expiry_date);
CREATE INDEX idx_documents_type ON public.documents(type);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE
  USING (user_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create private storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- Storage RLS policies
CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);