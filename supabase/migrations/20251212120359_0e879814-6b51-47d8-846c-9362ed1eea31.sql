
-- Create entities table for multi-structure wealth tracking
CREATE TABLE public.entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'personal',
  legal_name TEXT,
  registration_number TEXT,
  country TEXT,
  jurisdiction TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  formation_date DATE,
  dissolution_date DATE,
  owned_by_entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  ownership_percentage NUMERIC DEFAULT 100,
  color TEXT DEFAULT '#C4785A',
  icon TEXT DEFAULT '👤',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_entity_type CHECK (type IN ('personal', 'spouse', 'couple', 'company', 'holding', 'spv', 'trust', 'family')),
  CONSTRAINT valid_ownership_percentage CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100)
);

-- Enable RLS
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

-- RLS policies for entities
CREATE POLICY "Users can view own entities"
  ON public.entities FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own entities"
  ON public.entities FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own entities"
  ON public.entities FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own entities"
  ON public.entities FOR DELETE
  USING (user_id = auth.uid());

-- Add entity_id to assets table
ALTER TABLE public.assets ADD COLUMN entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL;
ALTER TABLE public.assets ADD COLUMN acquisition_type TEXT DEFAULT 'purchase';
ALTER TABLE public.assets ADD COLUMN acquisition_from TEXT;
ALTER TABLE public.assets ADD CONSTRAINT valid_acquisition_type CHECK (acquisition_type IN ('purchase', 'inheritance', 'donation', 'creation'));

-- Add entity_id to collections table
ALTER TABLE public.collections ADD COLUMN entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL;
ALTER TABLE public.collections ADD COLUMN acquisition_type TEXT DEFAULT 'purchase';
ALTER TABLE public.collections ADD COLUMN acquisition_from TEXT;
ALTER TABLE public.collections ADD CONSTRAINT valid_collection_acquisition_type CHECK (acquisition_type IN ('purchase', 'inheritance', 'donation', 'creation'));

-- Add entity_id to liabilities table
ALTER TABLE public.liabilities ADD COLUMN entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL;

-- Create function to prevent circular ownership
CREATE OR REPLACE FUNCTION public.check_circular_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    SELECT owned_by_entity_id INTO current_id FROM public.entities WHERE id = current_id;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for circular ownership check
CREATE TRIGGER prevent_circular_ownership
  BEFORE INSERT OR UPDATE ON public.entities
  FOR EACH ROW
  EXECUTE FUNCTION public.check_circular_ownership();

-- Create trigger for updated_at
CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON public.entities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create function to auto-create default personal entity
CREATE OR REPLACE FUNCTION public.ensure_default_entity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.entities (user_id, name, type, icon, color)
  VALUES (NEW.id, 'Personal', 'personal', '👤', '#C4785A')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create default entity when profile is created
CREATE TRIGGER create_default_entity_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_default_entity();
