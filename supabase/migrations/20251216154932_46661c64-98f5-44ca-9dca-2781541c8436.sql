-- Final 4 Security Fixes

-- FIX 1: entities_owned_by_user_fk - ON DELETE NO ACTION (composite FK can't SET NULL on NOT NULL column)
ALTER TABLE public.entities DROP CONSTRAINT IF EXISTS entities_owned_by_user_fk;

ALTER TABLE public.entities
  ADD CONSTRAINT entities_owned_by_user_fk
  FOREIGN KEY (owned_by_entity_id, user_id)
  REFERENCES public.entities(id, user_id)
  ON DELETE NO ACTION;

-- FIX 2: Missing tenant-safe FKs on documents table
-- First ensure unique constraints exist
CREATE UNIQUE INDEX IF NOT EXISTS collections_id_user_unique ON public.collections (id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS liabilities_id_user_unique ON public.liabilities (id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS receivables_id_user_unique ON public.receivables (id, user_id);

-- Add the composite FKs (use NOT VALID then VALIDATE for safety)
ALTER TABLE public.documents
  ADD CONSTRAINT documents_collection_user_fk
  FOREIGN KEY (collection_id, user_id) 
  REFERENCES public.collections(id, user_id) 
  NOT VALID;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_liability_user_fk
  FOREIGN KEY (liability_id, user_id) 
  REFERENCES public.liabilities(id, user_id) 
  NOT VALID;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_receivable_user_fk
  FOREIGN KEY (receivable_id, user_id) 
  REFERENCES public.receivables(id, user_id) 
  NOT VALID;

-- Validate the constraints
ALTER TABLE public.documents VALIDATE CONSTRAINT documents_collection_user_fk;
ALTER TABLE public.documents VALIDATE CONSTRAINT documents_liability_user_fk;
ALTER TABLE public.documents VALIDATE CONSTRAINT documents_receivable_user_fk;

-- FIX 3: Add uniqueness constraint on loan_payments
ALTER TABLE public.loan_payments
  ADD CONSTRAINT loan_payments_unique_per_schedule
  UNIQUE (loan_schedule_id, payment_number);

-- FIX 4: Add missing receivables → assets FK
ALTER TABLE public.receivables
  ADD CONSTRAINT receivables_linked_asset_user_fk
  FOREIGN KEY (linked_asset_id, user_id) 
  REFERENCES public.assets(id, user_id) 
  NOT VALID;

ALTER TABLE public.receivables VALIDATE CONSTRAINT receivables_linked_asset_user_fk;