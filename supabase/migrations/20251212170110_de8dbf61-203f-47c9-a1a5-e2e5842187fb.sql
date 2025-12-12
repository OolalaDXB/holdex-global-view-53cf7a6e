-- Add compliance mode to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
  compliance_mode TEXT DEFAULT 'none' CHECK (compliance_mode IN (
    'none',
    'islamic',
    'jewish', 
    'hindu',
    'all'
  ));