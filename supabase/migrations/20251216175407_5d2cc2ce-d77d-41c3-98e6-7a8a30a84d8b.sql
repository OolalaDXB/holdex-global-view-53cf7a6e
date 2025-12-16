-- Add direct user_id -> profiles FKs with ON DELETE CASCADE
ALTER TABLE public.loan_schedules
  ADD CONSTRAINT loan_schedules_user_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.loan_payments
  ADD CONSTRAINT loan_payments_user_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.payment_schedules
  ADD CONSTRAINT payment_schedules_user_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;