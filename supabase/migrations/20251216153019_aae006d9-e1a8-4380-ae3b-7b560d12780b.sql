-- FIX 1: Broken "Receivers can accept shares" policy
DROP POLICY IF EXISTS "Receivers can accept shares" ON public.shared_access;

CREATE POLICY "Receivers can accept shares"
ON public.shared_access
FOR UPDATE
USING (shared_with_id = auth.uid())
WITH CHECK (
  shared_with_id = auth.uid()
  AND status IN ('accepted', 'declined')
);

-- FIX 2: Remove duplicate simple FKs (keep only composite tenant-safe FKs)
-- Entities
ALTER TABLE public.entities DROP CONSTRAINT IF EXISTS entities_owned_by_entity_id_fkey;

-- Assets
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_entity_id_fkey;

-- Collections
ALTER TABLE public.collections DROP CONSTRAINT IF EXISTS collections_entity_id_fkey;

-- Liabilities
ALTER TABLE public.liabilities DROP CONSTRAINT IF EXISTS liabilities_entity_id_fkey;
ALTER TABLE public.liabilities DROP CONSTRAINT IF EXISTS liabilities_linked_asset_id_fkey;

-- Receivables
ALTER TABLE public.receivables DROP CONSTRAINT IF EXISTS receivables_entity_id_fkey;
ALTER TABLE public.receivables DROP CONSTRAINT IF EXISTS receivables_linked_asset_id_fkey;

-- Receivable Payments
ALTER TABLE public.receivable_payments DROP CONSTRAINT IF EXISTS receivable_payments_receivable_id_fkey;

-- Documents
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_asset_id_fkey;
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_entity_id_fkey;
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_liability_id_fkey;
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_collection_id_fkey;
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_receivable_id_fkey;

-- Payment Schedules
ALTER TABLE public.payment_schedules DROP CONSTRAINT IF EXISTS payment_schedules_asset_id_fkey;

-- Loan Schedules
ALTER TABLE public.loan_schedules DROP CONSTRAINT IF EXISTS loan_schedules_liability_id_fkey;

-- Loan Payments
ALTER TABLE public.loan_payments DROP CONSTRAINT IF EXISTS loan_payments_loan_schedule_id_fkey;

-- FIX 3: Rename file_url to file_path in documents table
ALTER TABLE public.documents RENAME COLUMN file_url TO file_path;