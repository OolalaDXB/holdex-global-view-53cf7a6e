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

// Fallback prices when API is rate limited
const fallbackPrices: Record<string, { price: number; change24h: number }> = {
  BTC: { price: 100000, change24h: 0 },
  ETH: { price: 3500, change24h: 0 },
  SOL: { price: 180, change24h: 0 },
  USDT: { price: 1, change24h: 0 },
  USDC: { price: 1, change24h: 0 },
  BNB: { price: 600, change24h: 0 },
  XRP: { price: 2.2, change24h: 0 },
  ADA: { price: 0.9, change24h: 0 },
  DOGE: { price: 0.35, change24h: 0 },
  MATIC: { price: 0.5, change24h: 0 },
  DOT: { price: 7, change24h: 0 },
  LTC: { price: 100, change24h: 0 },
  AVAX: { price: 35, change24h: 0 },
  LINK: { price: 15, change24h: 0 },
  UNI: { price: 12, change24h: 0 },
};

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

    // If rate limited (429), return fallback prices
    if (response.status === 429) {
      console.log('CoinGecko rate limited, returning fallback prices');
      return new Response(JSON.stringify({ prices: fallbackPrices, timestamp: Date.now(), fallback: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CoinGecko API error:', response.status, errorText);
      // Return fallback on any error
      return new Response(JSON.stringify({ prices: fallbackPrices, timestamp: Date.now(), fallback: true }), {
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

    console.log('Fetched crypto prices:', Object.keys(prices).length, 'tokens');

    return new Response(JSON.stringify({ prices, timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in crypto-prices function:', errorMessage);
    // Return fallback prices on error instead of 500
    return new Response(JSON.stringify({ prices: fallbackPrices, timestamp: Date.now(), fallback: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
