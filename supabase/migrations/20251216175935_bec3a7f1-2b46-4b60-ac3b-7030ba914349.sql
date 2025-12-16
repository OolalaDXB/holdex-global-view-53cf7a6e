-- Fix receivable_payments: change user_id FK from auth.users to profiles
ALTER TABLE public.receivable_payments
  DROP CONSTRAINT IF EXISTS receivable_payments_user_id_fkey;

ALTER TABLE public.receivable_payments
  ADD CONSTRAINT receivable_payments_user_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;