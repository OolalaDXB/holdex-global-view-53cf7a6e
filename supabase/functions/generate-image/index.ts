import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateRequest {
  assetType: 'watch' | 'vehicle' | 'art' | 'wine' | 'real-estate' | 'jewelry' | 'business' | 'crypto' | 'other';
  name: string;
  brand?: string;
  model?: string;
  description?: string;
  country?: string;
}

const generatePrompt = (req: GenerateRequest): string => {
  const baseStyle = "professional product photography, studio lighting, clean background, high resolution, luxury aesthetic, elegant composition";
  
  switch (req.assetType) {
    case 'watch':
      return `${req.brand || ''} ${req.model || ''} luxury watch, ${req.name}, ${baseStyle}, close-up detail shot, Swiss craftsmanship, on dark velvet`;
    
    case 'vehicle':
      return `${req.brand || ''} ${req.model || ''} luxury automobile, ${req.name}, ${baseStyle}, 3/4 front angle, showroom setting, dramatic lighting`;
    
    case 'art':
      return `${req.description || req.name}, fine art piece, gallery display, museum quality, elegant frame, sophisticated lighting, ${baseStyle}`;
    
    case 'wine':
      return `Premium wine bottle, ${req.name}, ${req.description || 'fine vintage wine'}, cellar atmosphere, oak barrel background, ${baseStyle}`;
    
    case 'jewelry':
      return `${req.name}, ${req.description || 'luxury jewelry'}, ${req.brand || ''}, macro photography, diamond sparkle, velvet display, ${baseStyle}`;
    
    case 'real-estate':
      const location = req.country ? `in ${req.country}` : '';
      return `Luxury property ${location}, ${req.name}, architectural photography, golden hour lighting, high-end real estate exterior, manicured landscape, ${baseStyle}`;
    
    case 'business':
      return `${req.name}, corporate headquarters building, modern glass architecture, executive business environment, professional corporate imagery, ${baseStyle}`;
    
    case 'crypto':
      return `Digital cryptocurrency concept art, ${req.name}, futuristic blockchain visualization, glowing digital currency, tech-forward aesthetic, abstract digital asset representation, ${baseStyle}`;
    
    default:
      return `${req.name}, ${req.description || ''}, premium luxury item, ${baseStyle}`;
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { assetType, name, brand, model, description, country } = await req.json() as GenerateRequest;
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const prompt = generatePrompt({ assetType, name, brand, model, description, country });
    console.log('Generating image with prompt:', prompt);

    // Call OpenAI gpt-image-1
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'medium',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || 'Failed to generate image');
    }

    const data = await response.json();
    console.log('OpenAI response received');
    
    // gpt-image-1 returns base64 by default
    const imageBase64 = data.data[0].b64_json;
    
    // Convert base64 to blob
    const imageBytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
    const imageBlob = new Blob([imageBytes], { type: 'image/png' });

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Upload to storage
    const filename = `${user.id}/ai-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('asset-images')
      .upload(filename, imageBlob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('asset-images')
      .getPublicUrl(uploadData.path);

    console.log('Image uploaded successfully:', publicUrl);

    return new Response(
      JSON.stringify({ imageUrl: publicUrl, prompt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-image function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
