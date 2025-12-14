import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from './useAuditLog';

export type SharedAccess = Tables<'shared_access'>;

export const useSharedAccess = (): UseQueryResult<SharedAccess[], Error> => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shared_access', user?.id],
    queryFn: async (): Promise<SharedAccess[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('shared_access')
        .select('*')
        .eq('owner_id', user.id);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
};

// Extended type for invitations with owner profile
interface OwnerProfile {
  id: string;
  full_name: string | null;
  email: string;
}

export type ReceivedInvitation = SharedAccess & {
  owner_profile: OwnerProfile | null;
};

// Hook to get invitations received by the current user (with owner profile info)
export const useReceivedInvitations = (): UseQueryResult<ReceivedInvitation[], Error> => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['received_invitations', user?.id],
    queryFn: async (): Promise<ReceivedInvitation[]> => {
      if (!user?.id) return [];
      
      // First get invitations where shared_with_id matches current user
      const { data: invitations, error } = await supabase
        .from('shared_access')
        .select('*')
        .eq('shared_with_id', user.id);

      if (error) throw error;
      
      if (!invitations || invitations.length === 0) {
        return [];
      }
      
      // Then fetch owner profiles for each invitation
      const ownerIds = [...new Set(invitations.map(inv => inv.owner_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', ownerIds);
      
      if (profilesError) throw profilesError;
      
      // Merge profile info into invitations
      const profileMap = new Map<string, OwnerProfile>(
        profiles?.map(p => [p.id, p]) ?? []
      );
      
      return invitations.map(inv => ({
        ...inv,
        owner_profile: profileMap.get(inv.owner_id) ?? null,
      }));
    },
    enabled: !!user,
  });
};

// Hook to fetch a specific user's profile (for viewing shared portfolios)
export const useSharedOwnerProfile = (ownerId: string | null | undefined): UseQueryResult<OwnerProfile | null, Error> => {
  return useQuery({
    queryKey: ['shared_owner_profile', ownerId],
    queryFn: async (): Promise<OwnerProfile | null> => {
      if (!ownerId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', ownerId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!ownerId,
  });
};

export const useInvitePartner = (): UseMutationResult<SharedAccess, Error, string> => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async (email: string): Promise<SharedAccess> => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('shared_access')
        .insert({
          owner_id: user.id,
          shared_with_email: email,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shared_access'] });
      logEvent({
        action: 'create',
        entityType: 'shared_access',
        entityId: data.id,
        metadata: { shared_with_email: data.shared_with_email },
      });
    },
  });
};

export const useRevokeAccess = (): UseMutationResult<string, Error, string> => {
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      const { error } = await supabase
        .from('shared_access')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['shared_access'] });
      logEvent({
        action: 'delete',
        entityType: 'shared_access',
        entityId: id,
      });
    },
  });
};

interface RespondToInvitationParams {
  id: string;
  status: 'accepted' | 'declined';
}

// Hook to accept or decline an invitation
export const useRespondToInvitation = (): UseMutationResult<RespondToInvitationParams, Error, RespondToInvitationParams> => {
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async ({ id, status }: RespondToInvitationParams): Promise<RespondToInvitationParams> => {
      const { error } = await supabase
        .from('shared_access')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      return { id, status };
    },
    onSuccess: ({ id, status }) => {
      queryClient.invalidateQueries({ queryKey: ['received_invitations'] });
      queryClient.invalidateQueries({ queryKey: ['shared_access'] });
      logEvent({
        action: 'update',
        entityType: 'shared_access',
        entityId: id,
        metadata: { status },
      });
    },
  });
};
