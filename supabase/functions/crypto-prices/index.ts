import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    const response = await fetch(
      'https://crypto-news51.p.rapidapi.com/api/v1/mini-crypto/prices?base_currency=USD&page=1&page_size=50',
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'crypto-news51.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RapidAPI error:', response.status, errorText);
      throw new Error(`RapidAPI error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the data to a simpler format
    // The API returns an array of crypto prices
    const prices: Record<string, { price: number; change24h: number }> = {};
    
    if (data && Array.isArray(data.data)) {
      data.data.forEach((crypto: any) => {
        const symbol = crypto.symbol?.toUpperCase();
        if (symbol) {
          prices[symbol] = {
            price: parseFloat(crypto.price) || 0,
            change24h: parseFloat(crypto.percent_change_24h) || 0,
          };
        }
      });
    }

    console.log('Fetched crypto prices:', Object.keys(prices).length, 'tokens');

    return new Response(JSON.stringify({ prices, timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in crypto-prices function:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
