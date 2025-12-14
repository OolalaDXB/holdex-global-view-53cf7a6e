import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GenerateImageParams {
  assetType: 'watch' | 'vehicle' | 'art' | 'wine' | 'real-estate' | 'jewelry' | 'business' | 'crypto' | 'other';
  name: string;
  brand?: string;
  model?: string;
  description?: string;
  country?: string;
  notes?: string;
}

export const useAIImageGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async (params: GenerateImageParams): Promise<string | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: params,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data?.imageUrl ?? null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateImage, isGenerating, error };
};
