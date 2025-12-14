import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { OwnershipAllocation, parseOwnershipAllocation } from '@/lib/types';
import { useAuditLog } from './useAuditLog';

export type Collection = Tables<'collections'> & {
  parsed_ownership_allocation?: OwnershipAllocation[] | null;
};
export type CollectionInsert = TablesInsert<'collections'>;

export const useCollections = (): UseQueryResult<Collection[], Error> => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['collections', user?.id],
    queryFn: async (): Promise<Collection[]> => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map(collection => ({
        ...collection,
        parsed_ownership_allocation: parseOwnershipAllocation(collection.ownership_allocation),
      }));
    },
    enabled: !!user,
  });
};

export const useCreateCollection = (): UseMutationResult<Tables<'collections'>, Error, Omit<CollectionInsert, 'user_id'>> => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async (collection: Omit<CollectionInsert, 'user_id'>): Promise<Tables<'collections'>> => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('collections')
        .insert({ ...collection, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      logEvent({
        action: 'create',
        entityType: 'collection',
        entityId: data.id,
        metadata: { name: data.name, type: data.type },
      });
    },
  });
};

type UpdateCollectionParams = Partial<Omit<Collection, 'parsed_ownership_allocation'>> & { id: string };

export const useUpdateCollection = (): UseMutationResult<Tables<'collections'>, Error, UpdateCollectionParams> => {
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateCollectionParams): Promise<Tables<'collections'>> => {
      const { data, error } = await supabase
        .from('collections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      logEvent({
        action: 'update',
        entityType: 'collection',
        entityId: data.id,
        metadata: { name: data.name, type: data.type },
      });
    },
  });
};

interface DeleteCollectionParams {
  id: string;
  name?: string;
}

export const useDeleteCollection = (): UseMutationResult<DeleteCollectionParams, Error, DeleteCollectionParams> => {
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async ({ id, name }: DeleteCollectionParams): Promise<DeleteCollectionParams> => {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, name };
    },
    onSuccess: ({ id, name }) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      logEvent({
        action: 'delete',
        entityType: 'collection',
        entityId: id,
        metadata: { name },
      });
    },
  });
};
