import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEY = '99f084bbea744d9c1125f5cd';
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest`;

// In-memory cache
interface CacheEntry {
  rates: Record<string, number>;
  baseCurrency: string;
  lastUpdated: string;
  timestamp: number;
}

let ratesCache: CacheEntry | null = null;
const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

function isCacheValid(): boolean {
  if (!ratesCache) return false;
  return Date.now() - ratesCache.timestamp < CACHE_MAX_AGE_MS;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const response = await fetch(`${BASE_URL}/EUR`);

    // If rate limited or error, try to use cache
    if (!response.ok) {
      console.log(`Exchange rate API error: ${response.status}`);
      
      if (isCacheValid() && ratesCache) {
        console.log('Returning stale cached exchange rates');
        return new Response(JSON.stringify({ 
          rates: ratesCache.rates,
          baseCurrency: ratesCache.baseCurrency,
          lastUpdated: ratesCache.lastUpdated,
          timestamp: ratesCache.timestamp,
          status: 'stale',
          message: 'Using cached rates (API temporarily unavailable)'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('No valid cache available');
      return new Response(JSON.stringify({ 
        rates: null,
        baseCurrency: 'EUR',
        lastUpdated: null,
        timestamp: Date.now(),
        status: 'unavailable',
        message: 'Exchange rates temporarily unavailable'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    if (data.result !== 'success') {
      console.log('Exchange rate API returned error result');
      
      if (isCacheValid() && ratesCache) {
        return new Response(JSON.stringify({ 
          rates: ratesCache.rates,
          baseCurrency: ratesCache.baseCurrency,
          lastUpdated: ratesCache.lastUpdated,
          timestamp: ratesCache.timestamp,
          status: 'stale',
          message: 'Using cached rates (API error)'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        rates: null,
        baseCurrency: 'EUR',
        lastUpdated: null,
        timestamp: Date.now(),
        status: 'unavailable',
        message: 'Exchange rates temporarily unavailable'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update cache
    ratesCache = {
      rates: data.conversion_rates,
      baseCurrency: data.base_code,
      lastUpdated: data.time_last_update_utc,
      timestamp: Date.now(),
    };

    console.log('Fetched exchange rates:', Object.keys(data.conversion_rates).length, 'currencies');

    return new Response(JSON.stringify({ 
      rates: data.conversion_rates,
      baseCurrency: data.base_code,
      lastUpdated: data.time_last_update_utc,
      timestamp: Date.now(),
      status: 'live',
      message: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in exchange-rates function:', errorMessage);
    
    // Try to use cache on error
    if (isCacheValid() && ratesCache) {
      console.log('Returning stale cached exchange rates after error');
      return new Response(JSON.stringify({ 
        rates: ratesCache.rates,
        baseCurrency: ratesCache.baseCurrency,
        lastUpdated: ratesCache.lastUpdated,
        timestamp: ratesCache.timestamp,
        status: 'stale',
        message: 'Using cached rates (API error)'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ 
      rates: null,
      baseCurrency: 'EUR',
      lastUpdated: null,
      timestamp: Date.now(),
      status: 'unavailable',
      message: 'Exchange rates temporarily unavailable'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
