-- ============================================================
-- VERSO WEALTH PLATFORM - COMPLETE DATABASE SCHEMA
-- Generated: 2025-12-16 (with security fixes)
-- 
-- SECURITY FIXES APPLIED:
-- ✅ FIX 1: "Receivers can accept shares" policy fixed
-- ✅ FIX 2: Duplicate simple FKs removed (composite tenant-safe FKs only)
-- ✅ FIX 3: file_url renamed to file_path (signed URLs at runtime)
-- ⚠️ FIX 4 & 5: Storage policies require Supabase Dashboard config
-- ============================================================

-- ============================================================
-- PART 1: TABLES
-- ============================================================

-- Profiles table (user settings and preferences)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  base_currency TEXT DEFAULT 'EUR',
  secondary_currency_1 TEXT DEFAULT 'USD',
  secondary_currency_2 TEXT DEFAULT 'AED',
  dark_mode BOOLEAN DEFAULT true,
  blur_amounts BOOLEAN DEFAULT false,
  area_unit TEXT DEFAULT 'sqm',
  monthly_income NUMERIC,
  monthly_income_currency TEXT DEFAULT 'EUR',
  fiscal_year_start TEXT DEFAULT '01-01',
  compliance_mode TEXT DEFAULT 'none',
  news_sources JSONB DEFAULT '["bloomberg", "reuters"]'::jsonb,
  dashboard_widgets JSONB DEFAULT '["net_worth", "chart", "breakdown_type", "breakdown_country", "breakdown_currency", "leasehold_reminders", "expiring_documents"]'::jsonb,
  favorite_cities JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Entities table (ownership structures)
CREATE TABLE public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'personal',
  icon TEXT DEFAULT '👤',
  color TEXT DEFAULT '#C4785A',
  country TEXT,
  jurisdiction TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  avatar_url TEXT,
  -- Individual fields
  date_of_birth DATE,
  nationality TEXT,
  tax_residence TEXT,
  -- Couple fields
  matrimonial_regime TEXT,
  marriage_date DATE,
  marriage_country TEXT,
  -- Company/Holding/SPV fields
  legal_name TEXT,
  legal_form TEXT,
  registration_number TEXT,
  share_capital NUMERIC,
  share_capital_currency TEXT DEFAULT 'EUR',
  formation_date DATE,
  dissolution_date DATE,
  -- Trust fields
  trustee_name TEXT,
  trust_type TEXT,
  beneficiaries JSONB,
  -- HUF fields
  karta_name TEXT,
  coparceners JSONB,
  -- Ownership hierarchy
  owned_by_entity_id UUID,
  ownership_percentage NUMERIC DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint for composite FK
CREATE UNIQUE INDEX entities_id_user_unique ON public.entities (id, user_id);

-- Assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entity_id UUID,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  current_value NUMERIC NOT NULL,
  purchase_value NUMERIC,
  purchase_date DATE,
  certainty TEXT DEFAULT 'certain',
  ownership_percentage NUMERIC DEFAULT 100,
  ownership_allocation JSONB,
  notes TEXT,
  image_url TEXT,
  -- Bank account fields
  institution TEXT,
  reference_balance NUMERIC,
  reference_date DATE,
  -- Investment/Crypto fields
  ticker TEXT,
  quantity NUMERIC,
  platform TEXT,
  -- Real estate fields
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  property_type TEXT,
  rooms INTEGER,
  size_sqm NUMERIC,
  rental_income NUMERIC,
  tenure_type TEXT,
  lease_end_date DATE,
  liquidity_status TEXT DEFAULT 'liquid',
  property_status TEXT DEFAULT 'owned',
  -- Off-plan fields
  developer TEXT,
  project_name TEXT,
  unit_number TEXT,
  total_price NUMERIC,
  amount_paid NUMERIC,
  expected_delivery DATE,
  -- Islamic finance fields
  is_shariah_compliant BOOLEAN DEFAULT false,
  shariah_certification TEXT,
  -- Acquisition tracking
  acquisition_type TEXT DEFAULT 'purchase',
  acquisition_from TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint for composite FK
CREATE UNIQUE INDEX assets_id_user_unique ON public.assets (id, user_id);

-- Collections table
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entity_id UUID,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  current_value NUMERIC NOT NULL,
  purchase_value NUMERIC,
  purchase_date DATE,
  certainty TEXT DEFAULT 'probable',
  ownership_percentage NUMERIC DEFAULT 100,
  ownership_allocation JSONB,
  notes TEXT,
  image_url TEXT,
  description TEXT,
  -- Type-specific fields
  brand TEXT,
  model TEXT,
  year INTEGER,
  -- LP/Fund fields
  fund_name TEXT,
  commitment_amount NUMERIC,
  called_amount NUMERIC,
  distribution_status TEXT,
  -- Acquisition tracking
  acquisition_type TEXT DEFAULT 'purchase',
  acquisition_from TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint for composite FK
CREATE UNIQUE INDEX collections_id_user_unique ON public.collections (id, user_id);

-- Liabilities table
CREATE TABLE public.liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entity_id UUID,
  linked_asset_id UUID,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  current_balance NUMERIC NOT NULL,
  original_amount NUMERIC,
  interest_rate NUMERIC,
  monthly_payment NUMERIC,
  start_date DATE,
  end_date DATE,
  institution TEXT,
  certainty TEXT DEFAULT 'certain',
  notes TEXT,
  -- Islamic finance fields
  financing_type TEXT DEFAULT 'conventional',
  is_shariah_compliant BOOLEAN DEFAULT false,
  shariah_advisor TEXT,
  cost_price NUMERIC,
  profit_margin NUMERIC,
  monthly_rental NUMERIC,
  residual_value NUMERIC,
  bank_ownership_percentage NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint for composite FK
CREATE UNIQUE INDEX liabilities_id_user_unique ON public.liabilities (id, user_id);

-- Receivables table
CREATE TABLE public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entity_id UUID,
  linked_asset_id UUID,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  currency TEXT NOT NULL,
  original_amount NUMERIC NOT NULL,
  current_balance NUMERIC NOT NULL,
  debtor_name TEXT NOT NULL,
  debtor_type TEXT,
  debtor_contact TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  certainty TEXT DEFAULT 'contractual',
  issue_date DATE,
  due_date DATE,
  interest_rate NUMERIC,
  repayment_schedule TEXT,
  recovery_probability TEXT,
  deposit_type TEXT,
  refund_conditions TEXT,
  description TEXT,
  notes TEXT,
  last_payment_date DATE,
  last_payment_amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint for composite FK
CREATE UNIQUE INDEX receivables_id_user_unique ON public.receivables (id, user_id);

-- Receivable payments table
CREATE TABLE public.receivable_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  receivable_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  asset_id UUID,
  collection_id UUID,
  liability_id UUID,
  entity_id UUID,
  receivable_id UUID,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,  -- Stores path, not URL; signed URLs generated at runtime
  document_date DATE,
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT false,
  verification_date DATE,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Loan schedules table
CREATE TABLE public.loan_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  liability_id UUID NOT NULL,
  principal_amount NUMERIC NOT NULL,
  interest_rate NUMERIC,
  start_date DATE NOT NULL,
  end_date DATE,
  term_months INTEGER,
  monthly_payment NUMERIC,
  total_interest NUMERIC,
  total_cost NUMERIC,
  payments_made INTEGER DEFAULT 0,
  next_payment_date DATE,
  remaining_principal NUMERIC,
  loan_type TEXT DEFAULT 'amortizing',
  rate_type TEXT DEFAULT 'fixed',
  payment_frequency TEXT DEFAULT 'monthly',
  is_imported BOOLEAN DEFAULT false,
  imported_schedule JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint for composite FK
CREATE UNIQUE INDEX loan_schedules_id_user_unique ON public.loan_schedules (id, user_id);

-- Loan payments table
CREATE TABLE public.loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  loan_schedule_id UUID NOT NULL,
  payment_number INTEGER NOT NULL,
  payment_date DATE NOT NULL,
  principal_amount NUMERIC,
  interest_amount NUMERIC,
  total_amount NUMERIC,
  remaining_principal NUMERIC,
  status TEXT DEFAULT 'scheduled',
  actual_payment_date DATE,
  actual_amount NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payment schedules table (for off-plan properties)
CREATE TABLE public.payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  asset_id UUID NOT NULL,
  payment_number INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  percentage NUMERIC,
  due_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  status TEXT DEFAULT 'pending',
  paid_date DATE,
  paid_amount NUMERIC,
  payment_reference TEXT,
  receipt_url TEXT,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Net worth history table
CREATE TABLE public.net_worth_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  total_assets_eur NUMERIC NOT NULL,
  total_collections_eur NUMERIC NOT NULL,
  total_liabilities_eur NUMERIC NOT NULL,
  net_worth_eur NUMERIC NOT NULL,
  breakdown_by_type JSONB,
  breakdown_by_country JSONB,
  breakdown_by_currency JSONB,
  certainty_breakdown_assets JSONB,
  certainty_breakdown_liabilities JSONB,
  exchange_rates_snapshot JSONB,
  crypto_prices_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shared access table
CREATE TABLE public.shared_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  shared_with_email TEXT NOT NULL,
  shared_with_id UUID,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit events table
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PART 2: FOREIGN KEYS (Composite FKs only for tenant safety)
-- Simple FKs removed per security fix #2
-- ============================================================

-- Profiles
-- (id references auth.users - handled by Supabase)

-- Entities (composite FK for self-reference)
ALTER TABLE public.entities
  ADD CONSTRAINT entities_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT entities_owned_by_user_fk 
    FOREIGN KEY (owned_by_entity_id, user_id) REFERENCES entities(id, user_id) ON DELETE SET NULL;

-- Assets (composite FK only)
ALTER TABLE public.assets
  ADD CONSTRAINT assets_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT assets_entity_user_fk 
    FOREIGN KEY (entity_id, user_id) REFERENCES entities(id, user_id) ON DELETE SET NULL;

-- Collections (composite FK only)
ALTER TABLE public.collections
  ADD CONSTRAINT collections_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT collections_entity_user_fk 
    FOREIGN KEY (entity_id, user_id) REFERENCES entities(id, user_id) ON DELETE SET NULL;

-- Liabilities (composite FKs only)
ALTER TABLE public.liabilities
  ADD CONSTRAINT liabilities_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT liabilities_entity_user_fk 
    FOREIGN KEY (entity_id, user_id) REFERENCES entities(id, user_id) ON DELETE SET NULL,
  ADD CONSTRAINT liabilities_asset_user_fk 
    FOREIGN KEY (linked_asset_id, user_id) REFERENCES assets(id, user_id) ON DELETE SET NULL;

-- Receivables (composite FK only)
ALTER TABLE public.receivables
  ADD CONSTRAINT receivables_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT receivables_entity_user_fk 
    FOREIGN KEY (entity_id, user_id) REFERENCES entities(id, user_id) ON DELETE SET NULL;

-- Receivable Payments (composite FK only)
ALTER TABLE public.receivable_payments
  ADD CONSTRAINT payments_receivable_user_fk 
    FOREIGN KEY (receivable_id, user_id) REFERENCES receivables(id, user_id) ON DELETE CASCADE;

-- Documents (composite FKs only)
ALTER TABLE public.documents
  ADD CONSTRAINT documents_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT documents_asset_user_fk 
    FOREIGN KEY (asset_id, user_id) REFERENCES assets(id, user_id) ON DELETE SET NULL,
  ADD CONSTRAINT documents_entity_user_fk 
    FOREIGN KEY (entity_id, user_id) REFERENCES entities(id, user_id) ON DELETE SET NULL;

-- Loan Schedules (composite FK only)
ALTER TABLE public.loan_schedules
  ADD CONSTRAINT loan_schedules_liability_user_fk 
    FOREIGN KEY (liability_id, user_id) REFERENCES liabilities(id, user_id) ON DELETE CASCADE;

-- Loan Payments (composite FK only)
ALTER TABLE public.loan_payments
  ADD CONSTRAINT loan_payments_schedule_user_fk 
    FOREIGN KEY (loan_schedule_id, user_id) REFERENCES loan_schedules(id, user_id) ON DELETE CASCADE;

-- Payment Schedules (composite FK only)
ALTER TABLE public.payment_schedules
  ADD CONSTRAINT schedules_asset_user_fk 
    FOREIGN KEY (asset_id, user_id) REFERENCES assets(id, user_id) ON DELETE CASCADE;

-- Net Worth History
ALTER TABLE public.net_worth_history
  ADD CONSTRAINT net_worth_history_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Shared Access
ALTER TABLE public.shared_access
  ADD CONSTRAINT shared_access_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT shared_access_shared_with_id_fkey 
    FOREIGN KEY (shared_with_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Audit Events
ALTER TABLE public.audit_events
  ADD CONSTRAINT audit_events_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================
-- PART 3: INDEXES (Performance optimization)
-- ============================================================

-- Assets indexes
CREATE INDEX idx_assets_user_id ON public.assets (user_id);
CREATE INDEX idx_assets_user_entity ON public.assets (user_id, entity_id);
CREATE INDEX idx_assets_type ON public.assets (type);

-- Collections indexes
CREATE INDEX idx_collections_user_id ON public.collections (user_id);
CREATE INDEX idx_collections_user_entity ON public.collections (user_id, entity_id);
CREATE INDEX idx_collections_type ON public.collections (type);

-- Liabilities indexes
CREATE INDEX idx_liabilities_user_id ON public.liabilities (user_id);
CREATE INDEX idx_liabilities_user_entity ON public.liabilities (user_id, entity_id);
CREATE INDEX idx_liabilities_linked_asset ON public.liabilities (linked_asset_id);

-- Receivables indexes
CREATE INDEX idx_receivables_user_id ON public.receivables (user_id);
CREATE INDEX idx_receivables_user_entity ON public.receivables (user_id, entity_id);
CREATE INDEX idx_receivables_status ON public.receivables (status);
CREATE INDEX idx_receivables_due_date ON public.receivables (due_date);

-- Receivable payments indexes
CREATE INDEX idx_receivable_payments_receivable ON public.receivable_payments (receivable_id);
CREATE INDEX idx_receivable_payments_user ON public.receivable_payments (user_id);

-- Documents indexes
CREATE INDEX idx_documents_user_id ON public.documents (user_id);
CREATE INDEX idx_documents_asset_id ON public.documents (asset_id);
CREATE INDEX idx_documents_collection_id ON public.documents (collection_id);
CREATE INDEX idx_documents_liability_id ON public.documents (liability_id);
CREATE INDEX idx_documents_entity_id ON public.documents (entity_id);
CREATE INDEX idx_documents_receivable_id ON public.documents (receivable_id);
CREATE INDEX idx_documents_type ON public.documents (type);
CREATE INDEX idx_documents_expiry_date ON public.documents (expiry_date);
CREATE INDEX idx_documents_expiry ON public.documents (user_id, expiry_date);

-- Entities indexes
CREATE INDEX idx_entities_user_id ON public.entities (user_id);
CREATE INDEX idx_entities_owned_by ON public.entities (owned_by_entity_id);

-- Loan schedules indexes
CREATE INDEX idx_loan_schedules_liability ON public.loan_schedules (liability_id);
CREATE INDEX idx_loan_schedules_user ON public.loan_schedules (user_id);

-- Loan payments indexes
CREATE INDEX idx_loan_payments_schedule ON public.loan_payments (loan_schedule_id);
CREATE INDEX idx_loan_payments_user ON public.loan_payments (user_id);
CREATE INDEX idx_loan_payments_date ON public.loan_payments (payment_date);
CREATE INDEX idx_loan_payments_status ON public.loan_payments (status);

-- Payment schedules indexes
CREATE INDEX idx_payment_schedules_asset ON public.payment_schedules (asset_id);
CREATE INDEX idx_payment_schedules_user ON public.payment_schedules (user_id);
CREATE INDEX idx_payment_schedules_status ON public.payment_schedules (status);

-- Net worth history indexes
CREATE INDEX idx_net_worth_history_user ON public.net_worth_history (user_id);
CREATE INDEX idx_net_worth_history_date ON public.net_worth_history (snapshot_date);
CREATE INDEX idx_net_worth_user_date ON public.net_worth_history (user_id, snapshot_date DESC);

-- Shared access indexes
CREATE INDEX idx_shared_access_owner ON public.shared_access (owner_id);
CREATE INDEX idx_shared_access_receiver ON public.shared_access (shared_with_id);
CREATE INDEX idx_shared_access_status ON public.shared_access (status);

-- Audit events indexes
CREATE INDEX idx_audit_events_user_id ON public.audit_events (user_id);
CREATE INDEX idx_audit_events_action ON public.audit_events (action);
CREATE INDEX idx_audit_events_entity_type ON public.audit_events (entity_type);
CREATE INDEX idx_audit_events_created_at ON public.audit_events (created_at DESC);
CREATE INDEX idx_audit_events_user_time ON public.audit_events (user_id, created_at DESC);

-- ============================================================
-- PART 4: FUNCTIONS
-- ============================================================

-- Function: Check circular ownership (prevents entity ownership loops)
CREATE OR REPLACE FUNCTION public.check_circular_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Function: Update receivable on payment (auto-updates balance and status)
CREATE OR REPLACE FUNCTION public.update_receivable_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Validate payment amount
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Invalid payment amount';
  END IF;

  -- Update with tenant check
  UPDATE public.receivables r
  SET
    current_balance = GREATEST(r.current_balance - NEW.amount, 0),
    last_payment_date = NEW.payment_date,
    last_payment_amount = NEW.amount,
    status = CASE
      WHEN (r.current_balance - NEW.amount) <= 0 THEN 'paid'
      WHEN (r.current_balance - NEW.amount) < r.original_amount THEN 'partial'
      ELSE r.status
    END,
    updated_at = now()
  WHERE r.id = NEW.receivable_id
    AND r.user_id = NEW.user_id;

  -- FAIL if no matching receivable found (defense in depth)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receivable not found or tenant mismatch';
  END IF;

  RETURN NEW;
END;
$$;

-- Function: Ensure default entity (creates Personal entity on user signup)
CREATE OR REPLACE FUNCTION public.ensure_default_entity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.entities (user_id, name, type, icon, color)
  VALUES (NEW.id, 'Personal', 'personal', '👤', '#C4785A')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Function: Log audit event (server-side audit logging)
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.audit_events (user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (
    COALESCE(auth.uid(), CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END),
    TG_OP,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    jsonb_build_object(
      'changed_at', now(),
      'entity_name', CASE WHEN TG_OP = 'DELETE' THEN OLD.name ELSE NEW.name END
    ),
    now()
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Function: Enforce receiver update restrictions (shared_access)
CREATE OR REPLACE FUNCTION public.enforce_receiver_update_restrictions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If the updater is the receiver (not the owner)
  IF OLD.shared_with_id = auth.uid() AND OLD.owner_id != auth.uid() THEN
    -- Ensure only status can be changed
    IF NEW.owner_id != OLD.owner_id 
       OR NEW.shared_with_email != OLD.shared_with_email 
       OR NEW.shared_with_id IS DISTINCT FROM OLD.shared_with_id
       OR NEW.created_at != OLD.created_at THEN
      RAISE EXCEPTION 'Receivers can only update the status field';
    END IF;
    
    -- Receivers can only set status to 'accepted' or 'declined'
    IF NEW.status NOT IN ('accepted', 'declined') AND NEW.status != OLD.status THEN
      RAISE EXCEPTION 'Receivers can only set status to accepted or declined';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: Validate ownership allocation (ensures percentages sum ≤ 100)
CREATE OR REPLACE FUNCTION public.validate_ownership_allocation(allocation jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  total_percentage numeric := 0;
  item jsonb;
BEGIN
  IF allocation IS NULL THEN
    RETURN true;
  END IF;
  
  FOR item IN SELECT * FROM jsonb_array_elements(allocation)
  LOOP
    total_percentage := total_percentage + COALESCE((item->>'percentage')::numeric, 0);
  END LOOP;
  
  RETURN total_percentage <= 100;
END;
$$;

-- Function: Handle new user (creates profile on auth.users insert)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- PART 5: TRIGGERS
-- ============================================================

-- Trigger: Create profile on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Create default entity on profile creation
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_default_entity();

-- Trigger: Check circular ownership on entities
CREATE TRIGGER check_circular_ownership_trigger
  BEFORE INSERT OR UPDATE ON public.entities
  FOR EACH ROW
  EXECUTE FUNCTION public.check_circular_ownership();

-- Trigger: Update receivable on payment
CREATE TRIGGER trg_update_receivable_on_payment
  AFTER INSERT ON public.receivable_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_receivable_on_payment();

-- Trigger: Enforce receiver update restrictions on shared_access
CREATE TRIGGER enforce_receiver_restrictions
  BEFORE UPDATE ON public.shared_access
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_receiver_update_restrictions();

-- Trigger: Audit logging for critical tables
CREATE TRIGGER audit_assets AFTER INSERT OR UPDATE OR DELETE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_liabilities AFTER INSERT OR UPDATE OR DELETE ON public.liabilities
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_entities AFTER INSERT OR UPDATE OR DELETE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_collections AFTER INSERT OR UPDATE OR DELETE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_receivables AFTER INSERT OR UPDATE OR DELETE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Triggers: Auto-update updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_liabilities_updated_at
  BEFORE UPDATE ON public.liabilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_receivables_updated_at
  BEFORE UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payment_schedules_updated_at
  BEFORE UPDATE ON public.payment_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_loan_schedules_updated_at
  BEFORE UPDATE ON public.loan_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- PART 6: ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivable_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_worth_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 7: ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Entities policies (with shared_access support)
CREATE POLICY "Users can view own entities" ON public.entities
  FOR SELECT USING (
    user_id = auth.uid() 
    OR user_id IN (
      SELECT owner_id FROM public.shared_access 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own entities" ON public.entities
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own entities" ON public.entities
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own entities" ON public.entities
  FOR DELETE USING (user_id = auth.uid());

-- Assets policies (with shared_access support)
CREATE POLICY "Users can view own assets" ON public.assets
  FOR SELECT USING (
    user_id = auth.uid() 
    OR user_id IN (
      SELECT owner_id FROM public.shared_access 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own assets" ON public.assets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own assets" ON public.assets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own assets" ON public.assets
  FOR DELETE USING (user_id = auth.uid());

-- Collections policies (with shared_access support)
CREATE POLICY "Users can view own collections" ON public.collections
  FOR SELECT USING (
    user_id = auth.uid() 
    OR user_id IN (
      SELECT owner_id FROM public.shared_access 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own collections" ON public.collections
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own collections" ON public.collections
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own collections" ON public.collections
  FOR DELETE USING (user_id = auth.uid());

-- Liabilities policies (with shared_access support)
CREATE POLICY "Users can view own liabilities" ON public.liabilities
  FOR SELECT USING (
    user_id = auth.uid() 
    OR user_id IN (
      SELECT owner_id FROM public.shared_access 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own liabilities" ON public.liabilities
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own liabilities" ON public.liabilities
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own liabilities" ON public.liabilities
  FOR DELETE USING (user_id = auth.uid());

-- Receivables policies (with shared_access support)
CREATE POLICY "Users can view own receivables" ON public.receivables
  FOR SELECT USING (
    user_id = auth.uid() 
    OR user_id IN (
      SELECT owner_id FROM public.shared_access 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own receivables" ON public.receivables
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own receivables" ON public.receivables
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own receivables" ON public.receivables
  FOR DELETE USING (user_id = auth.uid());

-- Receivable payments policies (with shared_access support)
CREATE POLICY "Users can view own payments" ON public.receivable_payments
  FOR SELECT USING (
    (user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.receivables r 
      WHERE r.id = receivable_payments.receivable_id AND r.user_id = auth.uid()
    ))
    OR user_id IN (
      SELECT owner_id FROM public.shared_access 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own payments" ON public.receivable_payments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.receivables r 
      WHERE r.id = receivable_payments.receivable_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own payments" ON public.receivable_payments
  FOR UPDATE USING (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.receivables r 
      WHERE r.id = receivable_payments.receivable_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own payments" ON public.receivable_payments
  FOR DELETE USING (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.receivables r 
      WHERE r.id = receivable_payments.receivable_id AND r.user_id = auth.uid()
    )
  );

-- Documents policies (with shared_access support)
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (
    user_id = auth.uid() 
    OR user_id IN (
      SELECT owner_id FROM public.shared_access 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own documents" ON public.documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (user_id = auth.uid());

-- Loan schedules policies (with shared_access support)
CREATE POLICY "Users can view own loan_schedules" ON public.loan_schedules
  FOR SELECT USING (
    user_id = auth.uid() 
    OR user_id IN (
      SELECT owner_id FROM public.shared_access 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own loan_schedules" ON public.loan_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loan_schedules" ON public.loan_schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loan_schedules" ON public.loan_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Loan payments policies (with shared_access support)
CREATE POLICY "Users can view own loan_payments" ON public.loan_payments
  FOR SELECT USING (
    user_id = auth.uid() 
    OR user_id IN (
      SELECT owner_id FROM public.shared_access 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own loan_payments" ON public.loan_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loan_payments" ON public.loan_payments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loan_payments" ON public.loan_payments
  FOR DELETE USING (auth.uid() = user_id);

-- Payment schedules policies (with shared_access support)
CREATE POLICY "Users can view own payment schedules" ON public.payment_schedules
  FOR SELECT USING (
    user_id = auth.uid() 
    OR user_id IN (
      SELECT owner_id FROM public.shared_access 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own payment schedules" ON public.payment_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment schedules" ON public.payment_schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment schedules" ON public.payment_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Net worth history policies (with shared_access support)
CREATE POLICY "Users can view own history" ON public.net_worth_history
  FOR SELECT USING (
    user_id = auth.uid() 
    OR user_id IN (
      SELECT owner_id FROM public.shared_access 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own history" ON public.net_worth_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own history" ON public.net_worth_history
  FOR DELETE USING (user_id = auth.uid());

-- Shared access policies
CREATE POLICY "Users can view shares they own or received" ON public.shared_access
  FOR SELECT USING (owner_id = auth.uid() OR shared_with_id = auth.uid());

CREATE POLICY "Users can create shares" ON public.shared_access
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their shares" ON public.shared_access
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- FIXED: Receivers can accept shares (broken self-reference fixed per security fix #1)
CREATE POLICY "Receivers can accept shares" ON public.shared_access
  FOR UPDATE USING (shared_with_id = auth.uid())
  WITH CHECK (shared_with_id = auth.uid() AND status IN ('accepted', 'declined'));

CREATE POLICY "Users can delete shares they own" ON public.shared_access
  FOR DELETE USING (owner_id = auth.uid());

-- Audit events policies (read-only for users)
CREATE POLICY "Users can view own audit events" ON public.audit_events
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- PART 8: STORAGE BUCKETS AND POLICIES
-- NOTE: Storage policies require Supabase Dashboard configuration
-- (Cannot be modified via migrations - reserved schema)
-- The policies below are documentation of intended configuration.
-- ============================================================

-- Create storage buckets (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('asset-images', 'asset-images', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- IMPORTANT: Configure these policies via Supabase Dashboard
-- FIX 4: Enable RLS on storage.objects (Dashboard: Storage > Policies)
-- FIX 5: Add TO authenticated to all policies (Dashboard: Storage > Policies)

-- Recommended storage policies for asset-images bucket:
-- (Apply via Dashboard with TO authenticated)
/*
CREATE POLICY "Users can view own images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);
*/

-- Recommended storage policies for documents bucket:
-- (Apply via Dashboard with TO authenticated)
/*
CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
*/

-- ============================================================
-- PART 9: DATA INTEGRITY CONSTRAINTS
-- ============================================================

-- Ownership percentage constraints
ALTER TABLE public.assets 
  ADD CONSTRAINT chk_assets_ownership_pct CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100);

ALTER TABLE public.collections 
  ADD CONSTRAINT chk_collections_ownership_pct CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100);

ALTER TABLE public.entities 
  ADD CONSTRAINT chk_entities_ownership_pct CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100);

-- Balance constraints
ALTER TABLE public.liabilities 
  ADD CONSTRAINT chk_liabilities_balance CHECK (current_balance >= 0);

-- Interest rate constraints
ALTER TABLE public.liabilities 
  ADD CONSTRAINT chk_liabilities_interest CHECK (interest_rate IS NULL OR (interest_rate >= 0 AND interest_rate <= 100));

ALTER TABLE public.loan_schedules 
  ADD CONSTRAINT chk_loan_schedules_interest CHECK (interest_rate IS NULL OR (interest_rate >= 0 AND interest_rate <= 100));

-- Ownership allocation validation (using function)
ALTER TABLE public.assets 
  ADD CONSTRAINT chk_assets_allocation CHECK (validate_ownership_allocation(ownership_allocation));

ALTER TABLE public.collections 
  ADD CONSTRAINT chk_collections_allocation CHECK (validate_ownership_allocation(ownership_allocation));

-- ============================================================
-- SECURITY SUMMARY
-- ============================================================
-- 
-- ✅ FIX 1: "Receivers can accept shares" policy fixed (line ~1108)
-- ✅ FIX 2: Duplicate simple FKs removed (Part 2 - composite FKs only)
-- ✅ FIX 3: file_url renamed to file_path (documents table, line ~271)
-- ⚠️ FIX 4: Enable storage.objects RLS (requires Supabase Dashboard)
-- ⚠️ FIX 5: Add TO authenticated to storage policies (requires Dashboard)
--
-- Remaining linter warnings:
-- - Function search_path mutable (some functions use empty search_path by design)
-- - Leaked password protection disabled (enable in Auth settings)
--
-- ============================================================
-- END OF SCHEMA
-- ============================================================
