-- Add certainty column to assets
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS certainty TEXT DEFAULT 'certain';

-- Add certainty column to liabilities
ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS certainty TEXT DEFAULT 'certain';

-- Add certainty column to receivables
ALTER TABLE public.receivables ADD COLUMN IF NOT EXISTS certainty TEXT DEFAULT 'contractual';