import { AppLayout } from '@/components/layout/AppLayout';
import { NetWorthCard } from '@/components/dashboard/NetWorthCard';
import { NetWorthChart } from '@/components/dashboard/NetWorthChart';
import { BreakdownBar } from '@/components/dashboard/BreakdownBar';
import { CurrencyBreakdown } from '@/components/dashboard/CurrencyBreakdown';
import { AssetCard } from '@/components/assets/AssetCard';
import { useAssets } from '@/hooks/useAssets';
import { useCollections } from '@/hooks/useCollections';
import { useLiabilities } from '@/hooks/useLiabilities';
import { useNetWorthHistory } from '@/hooks/useNetWorthHistory';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { convertToEUR, fallbackRates } from '@/lib/currency';
import { RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const { data: assets = [], isLoading: assetsLoading } = useAssets();
  const { data: collections = [], isLoading: collectionsLoading } = useCollections();
  const { data: liabilities = [], isLoading: liabilitiesLoading } = useLiabilities();
  const { data: netWorthHistoryData = [] } = useNetWorthHistory();
  const { data: exchangeRates, isLoading: ratesLoading, dataUpdatedAt } = useExchangeRates();

  const isLoading = assetsLoading || collectionsLoading || liabilitiesLoading;
  const rates = exchangeRates?.rates || fallbackRates;

  // Calculate totals using live rates
  const totalAssets = assets.reduce((sum, asset) => {
    const eurValue = convertToEUR(asset.current_value, asset.currency, rates);
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
    const eurValue = convertToEUR(asset.current_value, asset.currency, rates);
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
    const eurValue = convertToEUR(asset.current_value, asset.currency, rates);
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
    .slice(0, 5);

  // By currency
  const currencyMap: Record<string, number> = {};
  assets.forEach(asset => {
    const eurValue = convertToEUR(asset.current_value, asset.currency, rates);
    currencyMap[asset.currency] = (currencyMap[asset.currency] || 0) + eurValue;
  });

  const currencyBreakdown = Object.entries(currencyMap)
    .map(([currency, value]) => ({
      currency,
      percentage: totalGross > 0 ? (value / totalGross) * 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Recent assets (last 5)
  const recentAssets = assets.slice(0, 5);

  // Chart data
  const chartData = netWorthHistoryData.length > 0 
    ? netWorthHistoryData.map(item => ({
        month: new Date(item.snapshot_date).toLocaleDateString('en-US', { month: 'short' }),
        value: item.net_worth_eur,
      }))
    : [{ month: 'Now', value: netWorth }];

  // Calculate MTD change
  const previousValue = netWorthHistoryData.length > 1 
    ? netWorthHistoryData[netWorthHistoryData.length - 2]?.net_worth_eur 
    : netWorth;
  const change = previousValue > 0 
    ? ((netWorth - previousValue) / previousValue) * 100 
    : 0;

  // Format last updated time
  const lastUpdated = dataUpdatedAt 
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 lg:p-12 max-w-7xl flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading your wealth data...</div>
        </div>
      </AppLayout>
    );
  }

  const hasData = assets.length > 0 || collections.length > 0;

  return (
    <AppLayout>
      <div className="p-8 lg:p-12 max-w-7xl">
        {/* Header */}
        <header className="mb-12">
          <NetWorthCard totalValue={netWorth} change={change} />
          {lastUpdated && (
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <RefreshCw size={12} className={ratesLoading ? 'animate-spin' : ''} />
              <span>FX rates updated at {lastUpdated}</span>
            </div>
          )}
        </header>

        {hasData ? (
          <>
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
            {recentAssets.length > 0 && (
              <section>
                <h3 className="font-serif text-lg font-medium text-foreground mb-6">Recent Updates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {recentAssets.map((asset, index) => (
                    <AssetCard key={asset.id} asset={asset} rates={rates} delay={500 + (index * 100)} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <section className="text-center py-16">
            <p className="text-muted-foreground mb-4">No assets yet. Start building your wealth portfolio.</p>
            <a 
              href="/add" 
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Add Your First Asset
            </a>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
