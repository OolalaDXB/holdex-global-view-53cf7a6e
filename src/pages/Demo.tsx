import { AppLayout } from '@/components/layout/AppLayout';
import { NetWorthCard } from '@/components/dashboard/NetWorthCard';
import { NetWorthChart } from '@/components/dashboard/NetWorthChart';
import { BreakdownBar } from '@/components/dashboard/BreakdownBar';
import { CurrencyBreakdown } from '@/components/dashboard/CurrencyBreakdown';
import { AssetCard } from '@/components/assets/AssetCard';
import { useDemo } from '@/contexts/DemoContext';
import { convertToEUR, fallbackRates } from '@/lib/currency';
import { fallbackCryptoPrices } from '@/hooks/useCryptoPrices';
import { RefreshCw, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const Demo = () => {
  const { assets, collections, liabilities, netWorthHistory } = useDemo();

  // Use fallback rates for demo (realistic static rates)
  const rates = fallbackRates;
  const prices = fallbackCryptoPrices;

  // Helper to get asset value (with crypto prices)
  const getAssetValue = (asset: typeof assets[0]) => {
    if (asset.type === 'crypto' && asset.ticker && asset.quantity) {
      const cryptoPrice = prices[asset.ticker.toUpperCase()];
      if (cryptoPrice) {
        return cryptoPrice.price * asset.quantity;
      }
    }
    return asset.current_value;
  };

  // Calculate totals using rates
  const totalAssets = assets.reduce((sum, asset) => {
    const value = getAssetValue(asset);
    const eurValue = convertToEUR(value, asset.currency, rates);
    return sum + eurValue;
  }, 0);

  const totalCollections = collections.reduce((sum, item) => {
    const eurValue = convertToEUR(item.current_value, item.currency, rates);
    return sum + eurValue;
  }, 0);

  const totalLiabilities = liabilities.reduce((sum, item) => {
    const eurValue = convertToEUR(item.current_balance, item.currency, rates);
    return sum + eurValue;
  }, 0);

  const netWorth = totalAssets + totalCollections - totalLiabilities;

  // Calculate breakdowns
  const assetsByType = [
    { label: 'Real Estate', value: 0, percentage: 0 },
    { label: 'Investments', value: 0, percentage: 0 },
    { label: 'Business', value: 0, percentage: 0 },
    { label: 'Collections', value: totalCollections, percentage: 0 },
    { label: 'Cash', value: 0, percentage: 0 },
  ];

  assets.forEach(asset => {
    const value = getAssetValue(asset);
    const eurValue = convertToEUR(value, asset.currency, rates);
    if (asset.type === 'real-estate') assetsByType[0].value += eurValue;
    else if (asset.type === 'investment' || asset.type === 'crypto') assetsByType[1].value += eurValue;
    else if (asset.type === 'business') assetsByType[2].value += eurValue;
    else if (asset.type === 'bank') assetsByType[4].value += eurValue;
  });

  const totalGross = totalAssets + totalCollections;
  assetsByType.forEach(item => {
    item.percentage = totalGross > 0 ? (item.value / totalGross) * 100 : 0;
  });

  // By country
  const countryMap: Record<string, number> = {};
  assets.forEach(asset => {
    const value = getAssetValue(asset);
    const eurValue = convertToEUR(value, asset.currency, rates);
    countryMap[asset.country] = (countryMap[asset.country] || 0) + eurValue;
  });
  collections.forEach(item => {
    const eurValue = convertToEUR(item.current_value, item.currency, rates);
    countryMap[item.country] = (countryMap[item.country] || 0) + eurValue;
  });

  const assetsByCountry = Object.entries(countryMap)
    .map(([label, value]) => ({
      label,
      value,
      percentage: totalGross > 0 ? (value / totalGross) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // By currency
  const currencyMap: Record<string, number> = {};
  assets.forEach(asset => {
    const value = getAssetValue(asset);
    const eurValue = convertToEUR(value, asset.currency, rates);
    currencyMap[asset.currency] = (currencyMap[asset.currency] || 0) + eurValue;
  });
  collections.forEach(item => {
    const eurValue = convertToEUR(item.current_value, item.currency, rates);
    currencyMap[item.currency] = (currencyMap[item.currency] || 0) + eurValue;
  });

  const currencyBreakdown = Object.entries(currencyMap)
    .map(([currency, value]) => ({
      currency,
      percentage: totalGross > 0 ? (value / totalGross) * 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Recent assets (last 5)
  const recentAssets = [...assets]
    .sort((a, b) => new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime())
    .slice(0, 5);

  // Chart data
  const chartData = netWorthHistory.map(item => ({
    month: new Date(item.snapshot_date).toLocaleDateString('en-US', { month: 'short' }),
    value: item.net_worth_eur,
  }));

  // Calculate MTD change
  const previousValue = netWorthHistory.length > 1 
    ? netWorthHistory[netWorthHistory.length - 2]?.net_worth_eur 
    : netWorth;
  const change = previousValue > 0 
    ? ((netWorth - previousValue) / previousValue) * 100 
    : 0;

  return (
    <AppLayout isDemo>
      <div className="p-8 lg:p-12 max-w-7xl">
        {/* Demo Banner */}
        <div className="mb-8 p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
          <Info size={20} className="text-primary mt-0.5 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-foreground">Mode Démo</span>
              <Badge variant="outline" className="text-xs">Lucas Soleil</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Explorez toutes les fonctionnalités avec des données fictives. 
              <Link to="/auth" className="text-primary hover:underline ml-1">
                Créez un compte
              </Link> pour gérer votre propre patrimoine.
            </p>
          </div>
        </div>

        {/* Header */}
        <header className="mb-12">
          <NetWorthCard totalValue={netWorth} change={change} />
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <RefreshCw size={12} />
              <span>FX: Demo rates</span>
            </div>
            <div className="flex items-center gap-1">
              <RefreshCw size={12} />
              <span>Crypto: Demo prices</span>
            </div>
          </div>
        </header>

        {/* Chart */}
        <section className="mb-12">
          <NetWorthChart data={chartData} />
        </section>

        {/* Breakdowns */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <BreakdownBar 
            title="By Asset Type" 
            items={assetsByType.filter(i => i.percentage > 0)} 
            delay={200}
          />
          <BreakdownBar 
            title="By Country" 
            items={assetsByCountry} 
            delay={300}
          />
        </section>

        {/* Currency */}
        {currencyBreakdown.length > 0 && (
          <section className="mb-12 pb-12 border-b border-border">
            <CurrencyBreakdown items={currencyBreakdown} delay={400} />
          </section>
        )}

        {/* Recent Updates */}
        <section>
          <h3 className="font-serif text-lg font-medium text-foreground mb-6">Recent Updates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recentAssets.map((asset, index) => (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                rates={rates}
                cryptoPrices={prices}
                delay={500 + (index * 100)} 
              />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Demo;
