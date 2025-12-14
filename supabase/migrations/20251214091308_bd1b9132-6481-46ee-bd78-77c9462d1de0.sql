-- Add certainty field to collections table
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS certainty TEXT DEFAULT 'probable';

-- Add comment for documentation
COMMENT ON COLUMN public.collections.certainty IS 'Certainty level for collection valuations: certain, contractual, probable, optional';