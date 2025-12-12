-- =============================================
-- PART 1: ENTITY ENHANCEMENT
-- =============================================

-- Add individual-specific fields
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS
  date_of_birth DATE;

ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS
  nationality TEXT;

ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS
  tax_residence TEXT;

-- Add couple/marriage-specific fields
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS
  matrimonial_regime TEXT;

ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS
  marriage_date DATE;

ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS
  marriage_country TEXT;

-- Add company-specific fields
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS
  legal_form TEXT;

ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS
  share_capital DECIMAL(15,2);

ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS
  share_capital_currency TEXT DEFAULT 'EUR';

-- Add trust-specific fields
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS
  trustee_name TEXT;

ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS
  beneficiaries JSONB;

ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS
  trust_type TEXT;

-- Add HUF-specific fields
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS
  karta_name TEXT;

ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS
  coparceners JSONB;

-- =============================================
-- PART 2: ISLAMIC FINANCE - LIABILITIES
-- =============================================

ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS
  financing_type TEXT DEFAULT 'conventional';

ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS
  is_shariah_compliant BOOLEAN DEFAULT false;

ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS
  shariah_advisor TEXT;

ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS
  cost_price DECIMAL(15,2);

ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS
  profit_margin DECIMAL(15,2);

ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS
  monthly_rental DECIMAL(15,2);

ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS
  residual_value DECIMAL(15,2);

ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS
  bank_ownership_percentage DECIMAL(5,2);

-- =============================================
-- PART 3: ISLAMIC FINANCE - ASSETS
-- =============================================

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS
  is_shariah_compliant BOOLEAN DEFAULT false;

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS
  shariah_certification TEXT;