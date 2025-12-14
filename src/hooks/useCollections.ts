import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { OwnershipAllocation, parseOwnershipAllocation } from '@/lib/types';
import { useAuditLog } from './useAuditLog';

export type Collection = Tables<'collections'> & {
  parsed_ownership_allocation?: OwnershipAllocation[] | null;
};
export type CollectionInsert = TablesInsert<'collections'>;

export const useCollections = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['collections', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map(collection => ({
        ...collection,
        parsed_ownership_allocation: parseOwnershipAllocation(collection.ownership_allocation),
      })) as Collection[];
    },
    enabled: !!user,
  });
};

export const useCreateCollection = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async (collection: Omit<CollectionInsert, 'user_id'>) => {
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

export const useUpdateCollection = () => {
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Collection> & { id: string }) => {
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

export const useDeleteCollection = () => {
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name?: string }) => {
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
