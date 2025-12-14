import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AuditLogParams {
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, any>;
}

export function useAuditLog() {
  const { user } = useAuth();

  const logEvent = async ({
    action,
    entityType,
    entityId,
    metadata = {},
  }: AuditLogParams) => {
    if (!user) {
      console.warn('Cannot log audit event: no authenticated user');
      return;
    }

    try {
      const { error } = await supabase.from('audit_events').insert({
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        metadata,
        ip_address: null, // IP collected server-side if needed
      });

      if (error) {
        console.error('Failed to log audit event:', error);
      }
    } catch (err) {
      console.error('Error logging audit event:', err);
    }
  };

  return { logEvent };
}
