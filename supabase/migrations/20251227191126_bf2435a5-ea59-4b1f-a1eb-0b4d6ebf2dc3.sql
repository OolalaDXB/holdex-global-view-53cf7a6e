-- Ajouter la colonne ocr_text pour stocker le texte extrait des PDFs
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS ocr_text text;

-- Créer un index GIN pour la recherche full-text sur ocr_text
CREATE INDEX IF NOT EXISTS idx_documents_ocr_text_search 
ON public.documents 
USING GIN (to_tsvector('french', COALESCE(ocr_text, '')));

-- Créer un index GIN pour la recherche sur le nom
CREATE INDEX IF NOT EXISTS idx_documents_name_search 
ON public.documents 
USING GIN (to_tsvector('french', COALESCE(name, '')));

-- Créer un index GIN pour la recherche sur les notes
CREATE INDEX IF NOT EXISTS idx_documents_notes_search 
ON public.documents 
USING GIN (to_tsvector('french', COALESCE(notes, '')));

-- Créer un index sur les tags pour filtrage rapide
CREATE INDEX IF NOT EXISTS idx_documents_tags 
ON public.documents 
USING GIN (tags);