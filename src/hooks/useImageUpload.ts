import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useImageUpload = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (file: File, assetId: string): Promise<string | null> => {
    if (!user) throw new Error('Not authenticated');
    
    setIsUploading(true);
    setProgress(0);

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File must be less than 5MB');
      }

      // Generate unique filename
      const ext = file.name.split('.').pop();
      const filename = `${user.id}/${assetId}-${Date.now()}.${ext}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('asset-images')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('asset-images')
        .getPublicUrl(data.path);

      setProgress(100);
      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (imageUrl: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

    // Extract path from URL
    const path = imageUrl.split('/asset-images/')[1];
    if (!path) return;

    const { error } = await supabase.storage
      .from('asset-images')
      .remove([path]);

    if (error) throw error;
  };

  return { uploadImage, deleteImage, isUploading, progress };
};
