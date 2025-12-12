import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

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

export const useDocuments = (filters?: {
  assetId?: string;
  collectionId?: string;
  liabilityId?: string;
  entityId?: string;
  receivableId?: string;
}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['documents', user?.id, filters],
    queryFn: async () => {
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
      return data as Document[];
    },
    enabled: !!user,
  });
};

export const useAllDocuments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['documents', 'all', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
    enabled: !!user,
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (document: Omit<DocumentInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('documents')
        .insert({ ...document, user_id: user.id })
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

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Document> & { id: string }) => {
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

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useDocumentUpload = () => {
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

    const ext = file.name.split('.').pop();
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
    const path = pathWithParams.split('?')[0];

    const { error } = await supabase.storage
      .from('documents')
      .remove([path]);

    if (error) throw error;
  };

  return { uploadDocument, deleteDocument };
};

export const getExpiryStatus = (expiryDate: string | null): 'expired' | 'expiring' | 'valid' | null => {
  if (!expiryDate) return null;
  
  const expiry = new Date(expiryDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  if (expiry < now) return 'expired';
  if (expiry <= thirtyDaysFromNow) return 'expiring';
  return 'valid';
};
