BEGIN;

-- Replace "at least one link" with "exactly one link"
ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS at_least_one_link;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_exactly_one_link CHECK (
    (CASE WHEN asset_id      IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN collection_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN liability_id  IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN entity_id     IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN receivable_id IS NOT NULL THEN 1 ELSE 0 END)
    = 1
  );

-- Recreate doc FKs as CASCADE (so deleting the parent deletes the doc)
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_asset_user_fk;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_asset_user_fk
  FOREIGN KEY (asset_id, user_id)
  REFERENCES public.assets(id, user_id)
  ON DELETE CASCADE;

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_collection_user_fk;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_collection_user_fk
  FOREIGN KEY (collection_id, user_id)
  REFERENCES public.collections(id, user_id)
  ON DELETE CASCADE;

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_liability_user_fk;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_liability_user_fk
  FOREIGN KEY (liability_id, user_id)
  REFERENCES public.liabilities(id, user_id)
  ON DELETE CASCADE;

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_entity_user_fk;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_entity_user_fk
  FOREIGN KEY (entity_id, user_id)
  REFERENCES public.entities(id, user_id)
  ON DELETE CASCADE;

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_receivable_user_fk;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_receivable_user_fk
  FOREIGN KEY (receivable_id, user_id)
  REFERENCES public.receivables(id, user_id)
  ON DELETE CASCADE;

COMMIT;