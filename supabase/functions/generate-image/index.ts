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
      return `Digital asset concept art, ${req.name}, futuristic blockchain visualization, glowing digital currency tokens, tech-forward aesthetic, abstract digital asset representation, ${baseStyle}`;
    
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
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = generatePrompt({ assetType, name, brand, model, description, country });
    console.log('Generating image with prompt:', prompt);

    // Call Lovable AI Gateway with image generation model
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          { role: 'user', content: `Generate a high-quality image: ${prompt}` }
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded, please try again later');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted, please add funds to continue');
      }
      throw new Error(`Failed to generate image: ${errorText}`);
    }

    const data = await response.json();
    console.log('Lovable AI response received');
    
    // Extract base64 image from response
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData) {
      console.error('No image in response:', JSON.stringify(data));
      throw new Error('No image generated');
    }

    // Extract base64 content (remove data:image/png;base64, prefix)
    const base64Match = imageData.match(/^data:image\/\w+;base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid image format received');
    }
    const imageBase64 = base64Match[1];
    
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
