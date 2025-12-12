-- Add ownership_allocation column to assets table
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS ownership_allocation JSONB;

-- Add ownership_allocation column to collections table
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS ownership_allocation JSONB;

-- Update entity type constraint to include 'partner' and keep backward compatibility
ALTER TABLE public.entities DROP CONSTRAINT IF EXISTS valid_entity_type;
ALTER TABLE public.entities ADD CONSTRAINT valid_entity_type CHECK (type IN ('personal', 'spouse', 'partner', 'couple', 'company', 'holding', 'spv', 'trust', 'family', 'huf'));

-- Migrate existing 'spouse' to 'partner' for consistency
UPDATE public.entities SET type = 'partner' WHERE type = 'spouse';