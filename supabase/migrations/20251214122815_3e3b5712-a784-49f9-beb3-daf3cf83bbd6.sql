-- Add 'declined' as valid status option for share invitations

-- Update the CHECK constraint to include 'declined'
ALTER TABLE public.shared_access
DROP CONSTRAINT IF EXISTS shared_access_status_check;

ALTER TABLE public.shared_access
ADD CONSTRAINT shared_access_status_check 
CHECK (status IN ('pending', 'accepted', 'revoked', 'declined'));

-- Update the trigger function to allow receivers to decline shares
CREATE OR REPLACE FUNCTION public.enforce_receiver_update_restrictions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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