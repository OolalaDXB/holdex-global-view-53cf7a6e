-- Fix security vulnerability in shared_access UPDATE policy
-- Current policy allows receivers to modify owner_id which is dangerous

-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update shares they own or received" ON public.shared_access;

-- Create policy for owners - can update any field on their shares
CREATE POLICY "Owners can update their shares"
ON public.shared_access
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Create policy for receivers - can only update status to accept
-- Note: RLS policies cannot restrict to specific columns, so we use a trigger for enforcement
CREATE POLICY "Receivers can accept shares"
ON public.shared_access
FOR UPDATE
USING (shared_with_id = auth.uid())
WITH CHECK (
  shared_with_id = auth.uid() 
  AND owner_id = (SELECT owner_id FROM public.shared_access WHERE id = shared_access.id)
);

-- Add CHECK constraint on status to ensure valid values
ALTER TABLE public.shared_access
DROP CONSTRAINT IF EXISTS shared_access_status_check;

ALTER TABLE public.shared_access
ADD CONSTRAINT shared_access_status_check 
CHECK (status IN ('pending', 'accepted', 'revoked'));

-- Create a trigger function to prevent receivers from modifying fields other than status
CREATE OR REPLACE FUNCTION public.enforce_receiver_update_restrictions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the updater is the receiver (not the owner)
  IF OLD.shared_with_id = auth.uid() AND OLD.owner_id != auth.uid() THEN
    -- Ensure only status can be changed, and only to 'accepted'
    IF NEW.owner_id != OLD.owner_id 
       OR NEW.shared_with_email != OLD.shared_with_email 
       OR NEW.shared_with_id IS DISTINCT FROM OLD.shared_with_id
       OR NEW.created_at != OLD.created_at THEN
      RAISE EXCEPTION 'Receivers can only update the status field';
    END IF;
    
    -- Receivers can only set status to 'accepted'
    IF NEW.status != 'accepted' AND NEW.status != OLD.status THEN
      RAISE EXCEPTION 'Receivers can only set status to accepted';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS enforce_receiver_update_restrictions_trigger ON public.shared_access;

CREATE TRIGGER enforce_receiver_update_restrictions_trigger
BEFORE UPDATE ON public.shared_access
FOR EACH ROW
EXECUTE FUNCTION public.enforce_receiver_update_restrictions();