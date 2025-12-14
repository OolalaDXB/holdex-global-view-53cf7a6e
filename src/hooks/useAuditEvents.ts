import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AuditEvent {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

interface UseAuditEventsParams {
  actionFilter?: string;
  entityTypeFilter?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export const useAuditEvents = ({
  actionFilter,
  entityTypeFilter,
  startDate,
  endDate,
  limit = 100,
}: UseAuditEventsParams = {}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['audit_events', user?.id, actionFilter, entityTypeFilter, startDate?.toISOString(), endDate?.toISOString(), limit],
    queryFn: async () => {
      let query = supabase
        .from('audit_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (actionFilter && actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (entityTypeFilter && entityTypeFilter !== 'all') {
        query = query.eq('entity_type', entityTypeFilter);
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditEvent[];
    },
    enabled: !!user,
  });
};

export const AUDIT_ACTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'download', label: 'Download' },
  { value: 'export_pdf', label: 'Export PDF' },
];

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  asset: 'Asset',
  collection: 'Collection',
  shared_access: 'Shared Access',
  document: 'Document',
  balance_sheet: 'Balance Sheet',
  liability: 'Liability',
  receivable: 'Receivable',
  entity: 'Entity',
  loan_schedule: 'Loan Schedule',
  loan_payment: 'Loan Payment',
};

export const ENTITY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'asset', label: 'Asset' },
  { value: 'collection', label: 'Collection' },
  { value: 'liability', label: 'Liability' },
  { value: 'receivable', label: 'Receivable' },
  { value: 'entity', label: 'Entity' },
  { value: 'document', label: 'Document' },
  { value: 'shared_access', label: 'Shared Access' },
  { value: 'balance_sheet', label: 'Balance Sheet' },
  { value: 'loan_schedule', label: 'Loan Schedule' },
  { value: 'loan_payment', label: 'Loan Payment' },
];
