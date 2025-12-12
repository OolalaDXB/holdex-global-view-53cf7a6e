import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type Entity = Tables<'entities'>;
export type EntityInsert = TablesInsert<'entities'>;
export type EntityUpdate = TablesUpdate<'entities'>;

export const ENTITY_TYPES = [
  { value: 'personal', label: 'Personal', icon: '👤', category: 'individual' },
  { value: 'spouse', label: 'Spouse', icon: '👤', category: 'individual' },
  { value: 'couple', label: 'Couple', icon: '👫', category: 'relationship' },
  { value: 'company', label: 'Company', icon: '🏢', category: 'legal_entity' },
  { value: 'holding', label: 'Holding', icon: '🏛️', category: 'legal_entity' },
  { value: 'spv', label: 'SPV', icon: '📦', category: 'legal_entity' },
  { value: 'trust', label: 'Trust', icon: '🔒', category: 'trust' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', category: 'group' },
  { value: 'huf', label: 'HUF (Hindu Undivided Family)', icon: '🪷', category: 'huf' },
] as const;

export const MATRIMONIAL_REGIMES = [
  { value: 'community', label: 'Community of Property' },
  { value: 'legal_community', label: 'Legal Community (French default)' },
  { value: 'separation', label: 'Separation of Assets' },
  { value: 'participation', label: 'Participation in Acquisitions' },
  { value: 'mahr', label: 'Mahr (Islamic)' },
  { value: 'other', label: 'Other' },
] as const;

export const LEGAL_FORMS = [
  { value: 'sarl', label: 'SARL' },
  { value: 'sas', label: 'SAS' },
  { value: 'sa', label: 'SA' },
  { value: 'llc', label: 'LLC' },
  { value: 'fz-llc', label: 'FZ-LLC (Free Zone)' },
  { value: 'ltd', label: 'Ltd' },
  { value: 'llp', label: 'LLP' },
  { value: 'gmbh', label: 'GmbH' },
  { value: 'bv', label: 'BV' },
  { value: 'other', label: 'Other' },
] as const;

export const TRUST_TYPES = [
  { value: 'revocable', label: 'Revocable' },
  { value: 'irrevocable', label: 'Irrevocable' },
  { value: 'discretionary', label: 'Discretionary' },
  { value: 'fixed', label: 'Fixed Interest' },
  { value: 'charitable', label: 'Charitable' },
  { value: 'waqf', label: 'Waqf (Islamic Endowment)' },
] as const;

export type EntityType = typeof ENTITY_TYPES[number]['value'];

export const useEntities = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['entities', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Entity[];
    },
    enabled: !!user,
  });
};

export const useCreateEntity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entity: Omit<EntityInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('entities')
        .insert({ ...entity, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
    },
  });
};

export const useUpdateEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: EntityUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('entities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
    },
  });
};

export const useDeleteEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('entities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
    },
  });
};

export const useEnsureDefaultEntity = () => {
  const { user } = useAuth();
  const createEntity = useCreateEntity();
  const { data: entities } = useEntities();

  const ensureDefault = async () => {
    if (!user || !entities) return null;
    
    const personalEntity = entities.find(e => e.type === 'personal');
    if (personalEntity) return personalEntity;

    // Create default personal entity
    const result = await createEntity.mutateAsync({
      name: 'Personal',
      type: 'personal',
      icon: '👤',
      color: '#C4785A',
    });

    return result;
  };

  return { ensureDefault, isLoading: createEntity.isPending };
};
