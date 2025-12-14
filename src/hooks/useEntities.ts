import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { Beneficiary, Coparcener, parseBeneficiaries, parseCoparceners } from '@/lib/types';
import { useAuditLog } from '@/hooks/useAuditLog';

export type Entity = Tables<'entities'> & {
  parsed_beneficiaries?: Beneficiary[] | null;
  parsed_coparceners?: Coparcener[] | null;
};
export type EntityInsert = TablesInsert<'entities'>;
export type EntityUpdate = TablesUpdate<'entities'>;

export const ENTITY_TYPES = [
  { value: 'personal', label: 'Personal', icon: 'User', category: 'individual' },
  { value: 'partner', label: 'Partner', icon: 'UserCircle', category: 'individual' },
  { value: 'couple', label: 'Couple', icon: 'Users', category: 'relationship' },
  { value: 'company', label: 'Company', icon: 'Building2', category: 'legal_entity' },
  { value: 'holding', label: 'Holding', icon: 'Landmark', category: 'legal_entity' },
  { value: 'spv', label: 'SPV', icon: 'FolderClosed', category: 'legal_entity' },
  { value: 'trust', label: 'Trust', icon: 'Shield', category: 'trust' },
  { value: 'family', label: 'Family', icon: 'Users', category: 'group' },
  { value: 'huf', label: 'HUF (Hindu Undivided Family)', icon: 'Home', category: 'huf' },
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
  { value: 'revocable', label: 'Revocable', compliance: null },
  { value: 'irrevocable', label: 'Irrevocable', compliance: null },
  { value: 'discretionary', label: 'Discretionary', compliance: null },
  { value: 'fixed', label: 'Fixed Interest', compliance: null },
  { value: 'charitable', label: 'Charitable', compliance: null },
  { value: 'waqf', label: 'Waqf (Islamic Endowment)', compliance: 'islamic' },
] as const;

export type EntityType = typeof ENTITY_TYPES[number]['value'];
export type MatrimonialRegime = typeof MATRIMONIAL_REGIMES[number]['value'];
export type LegalForm = typeof LEGAL_FORMS[number]['value'];
export type TrustType = typeof TRUST_TYPES[number]['value'];

// Filter entity types based on compliance mode
export const getFilteredEntityTypes = (showHindu: boolean): typeof ENTITY_TYPES[number][] => {
  return ENTITY_TYPES.filter(type => {
    if (type.value === 'huf') return showHindu;
    return true;
  });
};

// Filter trust types based on compliance mode
export const getFilteredTrustTypes = (showIslamic: boolean): typeof TRUST_TYPES[number][] => {
  return TRUST_TYPES.filter(type => {
    if (type.compliance === 'islamic') return showIslamic;
    return true;
  });
};

export const useEntities = (): UseQueryResult<Entity[], Error> => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['entities', user?.id],
    queryFn: async (): Promise<Entity[]> => {
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []).map(entity => ({
        ...entity,
        parsed_beneficiaries: parseBeneficiaries(entity.beneficiaries),
        parsed_coparceners: parseCoparceners(entity.coparceners),
      }));
    },
    enabled: !!user,
  });
};

export const useCreateEntity = (): UseMutationResult<Tables<'entities'>, Error, Omit<EntityInsert, 'user_id'>> => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async (entity: Omit<EntityInsert, 'user_id'>): Promise<Tables<'entities'>> => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('entities')
        .insert({ ...entity, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      logEvent({
        action: 'create',
        entityType: 'entity',
        entityId: data.id,
        metadata: { name: data.name, type: data.type },
      });
    },
  });
};

type UpdateEntityParams = EntityUpdate & { id: string };

export const useUpdateEntity = (): UseMutationResult<Tables<'entities'>, Error, UpdateEntityParams> => {
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateEntityParams): Promise<Tables<'entities'>> => {
      const { data, error } = await supabase
        .from('entities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      logEvent({
        action: 'update',
        entityType: 'entity',
        entityId: data.id,
        metadata: { name: data.name },
      });
    },
  });
};

interface DeleteEntityParams {
  id: string;
  name?: string;
}

export const useDeleteEntity = (): UseMutationResult<DeleteEntityParams, Error, DeleteEntityParams> => {
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async ({ id, name }: DeleteEntityParams): Promise<DeleteEntityParams> => {
      const { error } = await supabase
        .from('entities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, name };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      logEvent({
        action: 'delete',
        entityType: 'entity',
        entityId: data.id,
        metadata: { name: data.name },
      });
    },
  });
};

interface EnsureDefaultEntityResult {
  ensureDefault: () => Promise<Tables<'entities'> | null>;
  isLoading: boolean;
}

export const useEnsureDefaultEntity = (): EnsureDefaultEntityResult => {
  const { user } = useAuth();
  const createEntity = useCreateEntity();
  const { data: entities } = useEntities();

  const ensureDefault = async (): Promise<Tables<'entities'> | null> => {
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
