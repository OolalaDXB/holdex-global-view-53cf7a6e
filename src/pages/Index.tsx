import { AppLayout } from '@/components/layout/AppLayout';
import { NetWorthCard } from '@/components/dashboard/NetWorthCard';
import { NetWorthChart } from '@/components/dashboard/NetWorthChart';
import { BreakdownBar } from '@/components/dashboard/BreakdownBar';
import { CurrencyBreakdown } from '@/components/dashboard/CurrencyBreakdown';
import { AssetCard } from '@/components/assets/AssetCard';
import { assets, collections, netWorthHistory, convertToEUR } from '@/lib/data';

const Dashboard = () => {
  // Calculate totals
  const totalAssets = assets.reduce((sum, asset) => {
    const eurValue = convertToEUR(asset.currentValue, asset.currency);
    return sum + eurValue;
  }, 0);

  const totalCollections = collections.reduce((sum, item) => {
    const eurValue = convertToEUR(item.currentValue, item.currency);
    return sum + eurValue;
  }, 0);

  const netWorth = totalAssets + totalCollections;

  // Calculate breakdowns
  const assetsByType = [
    { label: 'Real Estate', value: 0, percentage: 0 },
    { label: 'Investments', value: 0, percentage: 0 },
    { label: 'Business', value: 0, percentage: 0 },
    { label: 'Collections', value: totalCollections, percentage: 0 },
    { label: 'Cash', value: 0, percentage: 0 },
  ];

  assets.forEach(asset => {
    const eurValue = convertToEUR(asset.currentValue, asset.currency);
    if (asset.type === 'real-estate') assetsByType[0].value += eurValue;
    else if (asset.type === 'investment' || asset.type === 'crypto') assetsByType[1].value += eurValue;
    else if (asset.type === 'business') assetsByType[2].value += eurValue;
    else if (asset.type === 'bank') assetsByType[4].value += eurValue;
  });

  assetsByType.forEach(item => {
    item.percentage = netWorth > 0 ? (item.value / netWorth) * 100 : 0;
  });

  // By country
  const countryMap: Record<string, number> = {};
  assets.forEach(asset => {
    const eurValue = convertToEUR(asset.currentValue, asset.currency);
    countryMap[asset.country] = (countryMap[asset.country] || 0) + eurValue;
  });
  collections.forEach(item => {
    const eurValue = convertToEUR(item.currentValue, item.currency);
    countryMap[item.country] = (countryMap[item.country] || 0) + eurValue;
  });

  const assetsByCountry = Object.entries(countryMap)
    .map(([label, value]) => ({
      label,
      value,
      percentage: netWorth > 0 ? (value / netWorth) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // By currency
  const currencyMap: Record<string, number> = {};
  assets.forEach(asset => {
    const eurValue = convertToEUR(asset.currentValue, asset.currency);
    currencyMap[asset.currency] = (currencyMap[asset.currency] || 0) + eurValue;
  });

  const currencyBreakdown = Object.entries(currencyMap)
    .map(([currency, value]) => ({
      currency,
      percentage: netWorth > 0 ? (value / netWorth) * 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Recent assets (last 5)
  const recentAssets = assets.slice(0, 5);

  return (
    <AppLayout>
      <div className="p-8 lg:p-12 max-w-7xl">
        {/* Header */}
        <header className="mb-12">
          <NetWorthCard totalValue={netWorth} change={3.2} />
        </header>

        {/* Chart */}
        <section className="mb-12">
          <NetWorthChart data={netWorthHistory} />
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
        <section className="mb-12 pb-12 border-b border-border">
          <CurrencyBreakdown items={currencyBreakdown} delay={400} />
        </section>

        {/* Recent Updates */}
        <section>
          <h3 className="font-serif text-lg font-medium text-foreground mb-6">Recent Updates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recentAssets.map((asset, index) => (
              <AssetCard key={asset.id} asset={asset} delay={500 + (index * 100)} />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
