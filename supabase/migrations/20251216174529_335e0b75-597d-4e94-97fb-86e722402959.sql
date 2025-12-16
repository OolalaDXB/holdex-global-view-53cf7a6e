-- Remove duplicate user_id FK constraints (inline FKs with CASCADE are kept)
BEGIN;

ALTER TABLE public.loan_schedules
  DROP CONSTRAINT IF EXISTS loan_schedules_user_fk;

ALTER TABLE public.loan_payments
  DROP CONSTRAINT IF EXISTS loan_payments_user_fk;

ALTER TABLE public.payment_schedules
  DROP CONSTRAINT IF EXISTS payment_schedules_user_fk;

COMMIT;