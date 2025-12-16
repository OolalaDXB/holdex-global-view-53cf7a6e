
-- =====================================================
-- SECURITY FIXES MIGRATION — FINAL VERSION
-- =====================================================

-- =====================================================
-- 🔴 BLOCKER 1: Cross-tenant write vulnerability fix
-- =====================================================

-- Replace trigger with hardened fail-closed version
CREATE OR REPLACE FUNCTION public.update_receivable_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
$function$;

-- Defense-in-depth RLS on receivable_payments
DROP POLICY IF EXISTS "Users can insert own payments" ON public.receivable_payments;
CREATE POLICY "Users can insert own payments"
ON public.receivable_payments
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.receivables r
    WHERE r.id = receivable_id AND r.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view own payments" ON public.receivable_payments;
CREATE POLICY "Users can view own payments"
ON public.receivable_payments
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.receivables r
    WHERE r.id = receivable_id AND r.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own payments" ON public.receivable_payments;
CREATE POLICY "Users can update own payments"
ON public.receivable_payments
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.receivables r
    WHERE r.id = receivable_id AND r.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete own payments" ON public.receivable_payments;
CREATE POLICY "Users can delete own payments"
ON public.receivable_payments
FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.receivables r
    WHERE r.id = receivable_id AND r.user_id = auth.uid()
  )
);

-- =====================================================
-- 🔴 BLOCKER 2: Private storage bucket + policies
-- =====================================================

UPDATE storage.buckets SET public = false WHERE id = 'asset-images';

-- Upload policy
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'asset-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- View policy (required for createSignedUrl)
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
CREATE POLICY "Users can view own images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'asset-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update policy (rename/move)
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'asset-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'asset-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete policy
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'asset-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Remove old public policy if exists
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- =====================================================
-- 🟠 HIGH: Composite Foreign Keys (tenant-safe)
-- =====================================================

-- Step 1: Add unique constraints
ALTER TABLE public.entities 
  ADD CONSTRAINT entities_id_user_unique UNIQUE (id, user_id);

ALTER TABLE public.assets 
  ADD CONSTRAINT assets_id_user_unique UNIQUE (id, user_id);

ALTER TABLE public.liabilities 
  ADD CONSTRAINT liabilities_id_user_unique UNIQUE (id, user_id);

ALTER TABLE public.collections 
  ADD CONSTRAINT collections_id_user_unique UNIQUE (id, user_id);

ALTER TABLE public.receivables 
  ADD CONSTRAINT receivables_id_user_unique UNIQUE (id, user_id);

ALTER TABLE public.loan_schedules 
  ADD CONSTRAINT loan_schedules_id_user_unique UNIQUE (id, user_id);

-- Step 2: Add composite FK constraints

-- Assets → Entities (tenant-safe)
ALTER TABLE public.assets 
  ADD CONSTRAINT assets_entity_user_fk 
  FOREIGN KEY (entity_id, user_id) 
  REFERENCES public.entities(id, user_id) 
  ON DELETE SET NULL
  NOT VALID;
ALTER TABLE public.assets VALIDATE CONSTRAINT assets_entity_user_fk;

-- Collections → Entities (tenant-safe)
ALTER TABLE public.collections 
  ADD CONSTRAINT collections_entity_user_fk 
  FOREIGN KEY (entity_id, user_id) 
  REFERENCES public.entities(id, user_id) 
  ON DELETE SET NULL
  NOT VALID;
ALTER TABLE public.collections VALIDATE CONSTRAINT collections_entity_user_fk;

-- Liabilities → Entities (tenant-safe)
ALTER TABLE public.liabilities 
  ADD CONSTRAINT liabilities_entity_user_fk 
  FOREIGN KEY (entity_id, user_id) 
  REFERENCES public.entities(id, user_id) 
  ON DELETE SET NULL
  NOT VALID;
ALTER TABLE public.liabilities VALIDATE CONSTRAINT liabilities_entity_user_fk;

-- Liabilities → Assets (tenant-safe)
ALTER TABLE public.liabilities 
  ADD CONSTRAINT liabilities_asset_user_fk 
  FOREIGN KEY (linked_asset_id, user_id) 
  REFERENCES public.assets(id, user_id) 
  ON DELETE SET NULL
  NOT VALID;
ALTER TABLE public.liabilities VALIDATE CONSTRAINT liabilities_asset_user_fk;

-- Receivables → Entities (tenant-safe)
ALTER TABLE public.receivables 
  ADD CONSTRAINT receivables_entity_user_fk 
  FOREIGN KEY (entity_id, user_id) 
  REFERENCES public.entities(id, user_id) 
  ON DELETE SET NULL
  NOT VALID;
ALTER TABLE public.receivables VALIDATE CONSTRAINT receivables_entity_user_fk;

-- Receivable Payments → Receivables (tenant-safe)
ALTER TABLE public.receivable_payments 
  ADD CONSTRAINT payments_receivable_user_fk 
  FOREIGN KEY (receivable_id, user_id) 
  REFERENCES public.receivables(id, user_id) 
  ON DELETE CASCADE
  NOT VALID;
ALTER TABLE public.receivable_payments VALIDATE CONSTRAINT payments_receivable_user_fk;

-- Documents → Assets (tenant-safe)
ALTER TABLE public.documents 
  ADD CONSTRAINT documents_asset_user_fk 
  FOREIGN KEY (asset_id, user_id) 
  REFERENCES public.assets(id, user_id) 
  ON DELETE SET NULL
  NOT VALID;
ALTER TABLE public.documents VALIDATE CONSTRAINT documents_asset_user_fk;

-- Documents → Entities (tenant-safe)
ALTER TABLE public.documents 
  ADD CONSTRAINT documents_entity_user_fk 
  FOREIGN KEY (entity_id, user_id) 
  REFERENCES public.entities(id, user_id) 
  ON DELETE SET NULL
  NOT VALID;
ALTER TABLE public.documents VALIDATE CONSTRAINT documents_entity_user_fk;

-- Payment Schedules → Assets (tenant-safe)
ALTER TABLE public.payment_schedules 
  ADD CONSTRAINT schedules_asset_user_fk 
  FOREIGN KEY (asset_id, user_id) 
  REFERENCES public.assets(id, user_id) 
  ON DELETE CASCADE
  NOT VALID;
ALTER TABLE public.payment_schedules VALIDATE CONSTRAINT schedules_asset_user_fk;

-- Loan Schedules → Liabilities (tenant-safe)
ALTER TABLE public.loan_schedules 
  ADD CONSTRAINT loan_schedules_liability_user_fk 
  FOREIGN KEY (liability_id, user_id) 
  REFERENCES public.liabilities(id, user_id) 
  ON DELETE CASCADE
  NOT VALID;
ALTER TABLE public.loan_schedules VALIDATE CONSTRAINT loan_schedules_liability_user_fk;

-- Loan Payments → Loan Schedules (tenant-safe)
ALTER TABLE public.loan_payments 
  ADD CONSTRAINT loan_payments_schedule_user_fk 
  FOREIGN KEY (loan_schedule_id, user_id) 
  REFERENCES public.loan_schedules(id, user_id) 
  ON DELETE CASCADE
  NOT VALID;
ALTER TABLE public.loan_payments VALIDATE CONSTRAINT loan_payments_schedule_user_fk;

-- Entities → Entities (ownership hierarchy, tenant-safe)
ALTER TABLE public.entities 
  ADD CONSTRAINT entities_owned_by_user_fk 
  FOREIGN KEY (owned_by_entity_id, user_id) 
  REFERENCES public.entities(id, user_id) 
  ON DELETE SET NULL
  NOT VALID;
ALTER TABLE public.entities VALIDATE CONSTRAINT entities_owned_by_user_fk;

-- =====================================================
-- 🟠 HIGH: Performance indexes
-- =====================================================

-- Core user_id indexes
CREATE INDEX IF NOT EXISTS idx_entities_user_id ON public.entities(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_entity ON public.assets(user_id, entity_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_entity ON public.collections(user_id, entity_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_user_id ON public.liabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_user_entity ON public.liabilities(user_id, entity_id);
CREATE INDEX IF NOT EXISTS idx_receivables_user_id ON public.receivables(user_id);
CREATE INDEX IF NOT EXISTS idx_receivables_user_entity ON public.receivables(user_id, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON public.documents(user_id, expiry_date);

-- FK column indexes (critical for JOIN performance)
CREATE INDEX IF NOT EXISTS idx_liabilities_linked_asset ON public.liabilities(linked_asset_id);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_receivable ON public.receivable_payments(receivable_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_asset ON public.payment_schedules(asset_id);
CREATE INDEX IF NOT EXISTS idx_loan_schedules_liability ON public.loan_schedules(liability_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_schedule ON public.loan_payments(loan_schedule_id);
CREATE INDEX IF NOT EXISTS idx_entities_owned_by ON public.entities(owned_by_entity_id);

-- Shared access (critical for RLS subqueries)
CREATE INDEX IF NOT EXISTS idx_shared_access_shared_with ON public.shared_access(shared_with_id, status, owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_access_owner ON public.shared_access(owner_id);

-- Time-ordered queries
CREATE INDEX IF NOT EXISTS idx_audit_events_user_time ON public.audit_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_net_worth_history_user_date ON public.net_worth_history(user_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_user_date ON public.receivable_payments(user_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_user_due ON public.payment_schedules(user_id, due_date);

-- =====================================================
-- 🟡 MEDIUM: Server-only audit (minimal logging)
-- =====================================================

-- Remove client insert permission
DROP POLICY IF EXISTS "Users can insert own audit events" ON public.audit_events;

-- Minimal audit function (no full payload)
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
$function$;

-- Attach to critical tables
DROP TRIGGER IF EXISTS audit_assets ON public.assets;
CREATE TRIGGER audit_assets
  AFTER INSERT OR UPDATE OR DELETE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_liabilities ON public.liabilities;
CREATE TRIGGER audit_liabilities
  AFTER INSERT OR UPDATE OR DELETE ON public.liabilities
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_entities ON public.entities;
CREATE TRIGGER audit_entities
  AFTER INSERT OR UPDATE OR DELETE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_collections ON public.collections;
CREATE TRIGGER audit_collections
  AFTER INSERT OR UPDATE OR DELETE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_receivables ON public.receivables;
CREATE TRIGGER audit_receivables
  AFTER INSERT OR UPDATE OR DELETE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- =====================================================
-- 🟡 MEDIUM: updated_at triggers
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_entities_updated_at ON public.entities;
CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_assets_updated_at ON public.assets;
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_collections_updated_at ON public.collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_liabilities_updated_at ON public.liabilities;
CREATE TRIGGER update_liabilities_updated_at
  BEFORE UPDATE ON public.liabilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_receivables_updated_at ON public.receivables;
CREATE TRIGGER update_receivables_updated_at
  BEFORE UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_payment_schedules_updated_at ON public.payment_schedules;
CREATE TRIGGER update_payment_schedules_updated_at
  BEFORE UPDATE ON public.payment_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_loan_schedules_updated_at ON public.loan_schedules;
CREATE TRIGGER update_loan_schedules_updated_at
  BEFORE UPDATE ON public.loan_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
