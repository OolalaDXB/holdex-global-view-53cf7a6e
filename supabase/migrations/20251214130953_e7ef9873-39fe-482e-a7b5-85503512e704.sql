-- Create audit_events table for tracking sensitive actions
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own audit events
CREATE POLICY "Users can insert own audit events"
ON public.audit_events
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can only read their own audit events
CREATE POLICY "Users can view own audit events"
ON public.audit_events
FOR SELECT
USING (user_id = auth.uid());

-- NO UPDATE or DELETE policies - this table is insert-only

-- Add index for faster queries by user_id and created_at
CREATE INDEX idx_audit_events_user_id ON public.audit_events(user_id);
CREATE INDEX idx_audit_events_created_at ON public.audit_events(created_at DESC);
CREATE INDEX idx_audit_events_action ON public.audit_events(action);
CREATE INDEX idx_audit_events_entity_type ON public.audit_events(entity_type);