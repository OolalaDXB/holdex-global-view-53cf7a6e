import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';

export type Document = Tables<'documents'>;
export type DocumentInsert = TablesInsert<'documents'>;

export const DOCUMENT_TYPES = [
  { value: 'title_deed', label: 'Title Deed', icon: '📜' },
  { value: 'contract', label: 'Contract', icon: '📝' },
  { value: 'invoice', label: 'Invoice', icon: '🧾' },
  { value: 'passport', label: 'Passport', icon: '🛂' },
  { value: 'tax_return', label: 'Tax Return', icon: '📊' },
  { value: 'statement', label: 'Statement', icon: '📋' },
  { value: 'insurance', label: 'Insurance', icon: '🛡️' },
  { value: 'valuation', label: 'Valuation', icon: '💰' },
  { value: 'certificate', label: 'Certificate', icon: '🏆' },
  { value: 'other', label: 'Other', icon: '📄' },
] as const;

export type DocumentType = typeof DOCUMENT_TYPES[number]['value'];

interface DocumentFilters {
  assetId?: string;
  collectionId?: string;
  liabilityId?: string;
  entityId?: string;
  receivableId?: string;
}

export const useDocuments = (filters?: DocumentFilters): UseQueryResult<Document[], Error> => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['documents', user?.id, filters],
    queryFn: async (): Promise<Document[]> => {
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.assetId) {
        query = query.eq('asset_id', filters.assetId);
      }
      if (filters?.collectionId) {
        query = query.eq('collection_id', filters.collectionId);
      }
      if (filters?.liabilityId) {
        query = query.eq('liability_id', filters.liabilityId);
      }
      if (filters?.entityId) {
        query = query.eq('entity_id', filters.entityId);
      }
      if (filters?.receivableId) {
        query = query.eq('receivable_id', filters.receivableId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
};

export const useAllDocuments = (): UseQueryResult<Document[], Error> => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['documents', 'all', user?.id],
    queryFn: async (): Promise<Document[]> => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
};

export const useCreateDocument = (): UseMutationResult<Document, Error, Omit<DocumentInsert, 'user_id'>> => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async (document: Omit<DocumentInsert, 'user_id'>): Promise<Document> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('documents')
        .insert({ ...document, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      logEvent({
        action: 'create',
        entityType: 'document',
        entityId: data.id,
        metadata: { name: data.name, type: data.type },
      });
    },
  });
};

type UpdateDocumentParams = Partial<Document> & { id: string };

export const useUpdateDocument = (): UseMutationResult<Document, Error, UpdateDocumentParams> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateDocumentParams): Promise<Document> => {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

interface DeleteDocumentParams {
  id: string;
  name?: string;
}

export const useDeleteDocument = (): UseMutationResult<DeleteDocumentParams, Error, DeleteDocumentParams> => {
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  return useMutation({
    mutationFn: async ({ id, name }: DeleteDocumentParams): Promise<DeleteDocumentParams> => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, name };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      logEvent({
        action: 'delete',
        entityType: 'document',
        entityId: data.id,
        metadata: { name: data.name },
      });
    },
  });
};

interface DocumentUploadResult {
  uploadDocument: (file: File, documentId: string) => Promise<string>;
  deleteDocument: (fileUrl: string) => Promise<void>;
}

export const useDocumentUpload = (): DocumentUploadResult => {
  const { user } = useAuth();

  const uploadDocument = async (file: File, documentId: string): Promise<string> => {
    if (!user) throw new Error('Not authenticated');

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File must be less than 10MB');
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File must be PDF, JPG, PNG, or WebP');
    }

    const ext = file.name.split('.').pop() ?? 'bin';
    const filename = `${user.id}/${documentId}-${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get signed URL for private bucket
    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(data.path, 60 * 60 * 24 * 365); // 1 year

    if (signedError) throw signedError;

    return signedData.signedUrl;
  };

  const deleteDocument = async (fileUrl: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

    // Extract path from signed URL
    const urlParts = fileUrl.split('/documents/');
    if (urlParts.length < 2) return;
    
    const pathWithParams = urlParts[1];
    const path = pathWithParams?.split('?')[0];

    if (!path) return;

    const { error } = await supabase.storage
      .from('documents')
      .remove([path]);

    if (error) throw error;
  };

  return { uploadDocument, deleteDocument };
};

export type ExpiryStatus = 'expired' | 'expiring' | 'valid' | null;

export const getExpiryStatus = (expiryDate: string | null | undefined): ExpiryStatus => {
  if (!expiryDate) return null;
  
  const expiry = new Date(expiryDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  if (expiry < now) return 'expired';
  if (expiry <= thirtyDaysFromNow) return 'expiring';
  return 'valid';
};
