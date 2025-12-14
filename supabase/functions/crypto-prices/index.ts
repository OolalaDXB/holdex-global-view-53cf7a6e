import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map of ticker symbols to CoinGecko IDs
const tickerToId: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'MATIC': 'matic-network',
  'DOT': 'polkadot',
  'LTC': 'litecoin',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
};

// In-memory cache
interface CacheEntry {
  prices: Record<string, { price: number; change24h: number }>;
  timestamp: number;
}

let priceCache: CacheEntry | null = null;
const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

function isCacheValid(): boolean {
  if (!priceCache) return false;
  return Date.now() - priceCache.timestamp < CACHE_MAX_AGE_MS;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ids = Object.values(tickerToId).join(',');
    
    // Use CoinGecko free API (no auth required)
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );

    // If rate limited or error, try to use cache
    if (!response.ok) {
      console.log(`CoinGecko API error: ${response.status}`);
      
      if (isCacheValid() && priceCache) {
        console.log('Returning stale cached prices');
        return new Response(JSON.stringify({ 
          prices: priceCache.prices, 
          timestamp: priceCache.timestamp,
          status: 'stale',
          message: 'Using cached prices (API temporarily unavailable)'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('No valid cache available');
      return new Response(JSON.stringify({ 
        prices: null, 
        timestamp: Date.now(),
        status: 'unavailable',
        message: 'Crypto prices temporarily unavailable'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    // Transform the data to our format using ticker symbols
    const prices: Record<string, { price: number; change24h: number }> = {};
    
    for (const [ticker, coinId] of Object.entries(tickerToId)) {
      const coinData = data[coinId];
      if (coinData) {
        prices[ticker] = {
          price: coinData.usd || 0,
          change24h: coinData.usd_24h_change || 0,
        };
      }
    }

    // Update cache
    priceCache = {
      prices,
      timestamp: Date.now(),
    };

    console.log('Fetched crypto prices:', Object.keys(prices).length, 'tokens');

    return new Response(JSON.stringify({ 
      prices, 
      timestamp: Date.now(),
      status: 'live',
      message: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in crypto-prices function:', errorMessage);
    
    // Try to use cache on error
    if (isCacheValid() && priceCache) {
      console.log('Returning stale cached prices after error');
      return new Response(JSON.stringify({ 
        prices: priceCache.prices, 
        timestamp: priceCache.timestamp,
        status: 'stale',
        message: 'Using cached prices (API error)'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ 
      prices: null, 
      timestamp: Date.now(),
      status: 'unavailable',
      message: 'Crypto prices temporarily unavailable'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
