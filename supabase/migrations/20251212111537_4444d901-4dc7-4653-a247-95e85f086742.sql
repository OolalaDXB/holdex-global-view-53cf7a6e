-- Add reference balance fields for bank accounts
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS reference_balance NUMERIC;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS reference_date DATE;

-- Add comments
COMMENT ON COLUMN public.assets.reference_balance IS 'Reference balance for bank accounts to track evolution';
COMMENT ON COLUMN public.assets.reference_date IS 'Date of the reference balance';