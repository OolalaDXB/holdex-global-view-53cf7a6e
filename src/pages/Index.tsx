import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { NetWorthCard } from '@/components/dashboard/NetWorthCard';
import { NetWorthChart } from '@/components/dashboard/NetWorthChart';
import { CertaintyTrendChart } from '@/components/dashboard/CertaintyTrendChart';
import { BreakdownBar } from '@/components/dashboard/BreakdownBar';
import { CurrencyBreakdown } from '@/components/dashboard/CurrencyBreakdown';

import { CurrencySwitcher } from '@/components/dashboard/CurrencySwitcher';
import { ViewToggle, useViewConfig } from '@/components/dashboard/ViewToggle';
import { CollectionsGallery } from '@/components/dashboard/CollectionsGallery';
import { CollapsibleSection, CollapsibleProvider, ExpandCollapseAllButton } from '@/components/dashboard/CollapsibleSection';
import { ExpiringDocumentsWidget } from '@/components/dashboard/ExpiringDocumentsWidget';
import { LeaseholdRemindersWidget } from '@/components/dashboard/LeaseholdRemindersWidget';
import { WorldClocksWidget } from '@/components/dashboard/WorldClocksWidget';
import { NewsTicker } from '@/components/dashboard/NewsTicker';
import { BlurToggle } from '@/components/dashboard/BlurToggle';
import { PendingReceivablesWidget } from '@/components/dashboard/PendingReceivablesWidget';
import { UpcomingLoanPaymentsWidget } from '@/components/dashboard/UpcomingLoanPaymentsWidget';
import { EntityBreakdown } from '@/components/dashboard/EntityBreakdown';
import { CertaintySummary } from '@/components/dashboard/CertaintySummary';
import { CertaintyMiniChart } from '@/components/dashboard/CertaintyMiniChart';
import { CertaintyBreakdownWidget } from '@/components/dashboard/CertaintyBreakdownWidget';
import { DebtToIncomeWidget } from '@/components/dashboard/DebtToIncomeWidget';
import { NetWorthProjectionWidget } from '@/components/dashboard/NetWorthProjectionWidget';
import { AssetCard } from '@/components/assets/AssetCard';
import { OnboardingWizard } from '@/components/dashboard/OnboardingWizard';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAssets } from '@/hooks/useAssets';
import { useEntities } from '@/hooks/useEntities';
import { useCollections } from '@/hooks/useCollections';
import { useLiabilities } from '@/hooks/useLiabilities';
import { useNetWorthHistory } from '@/hooks/useNetWorthHistory';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useSaveSnapshot } from '@/hooks/useNetWorthSnapshot';
import { useProfile, FavoriteCity } from '@/hooks/useProfile';
import { useSharedOwnerProfile } from '@/hooks/useSharedAccess';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useBlur } from '@/contexts/BlurContext';
import { convertToEUR, convertFromEUR, fallbackRates, formatCurrency } from '@/lib/currency';
import { RefreshCw, Camera, Info, AlertTriangle, Eye, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getCountryFlag } from '@/hooks/useCountries';


// Helper to calculate user's share of an asset/collection based on ownership_allocation
const getUserOwnershipShare = (
  ownershipAllocation: { entity_id: string; percentage: number }[] | null | undefined,
  personalEntityId: string | null
): number => {
  if (!ownershipAllocation || ownershipAllocation.length === 0) {
    return 1; // Full ownership if no allocation
  }
  // Find personal entity's share
  const myShare = ownershipAllocation.find(a => a.entity_id === personalEntityId);
  return myShare ? myShare.percentage / 100 : 1;
};

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check if viewing someone else's portfolio
  const viewingOwnerId = searchParams.get('view');
  const { data: sharedOwnerProfile } = useSharedOwnerProfile(viewingOwnerId);
  const isViewingShared = !!viewingOwnerId;
  
  const { data: profile } = useProfile();
  const { data: assets = [], isLoading: assetsLoading } = useAssets();
  const { data: entities = [] } = useEntities();
  const { data: collections = [], isLoading: collectionsLoading } = useCollections();
  const { data: liabilities = [], isLoading: liabilitiesLoading } = useLiabilities();
  const { data: netWorthHistoryData = [] } = useNetWorthHistory();
  const { data: exchangeRates, isLoading: ratesLoading, isFetching: ratesFetching, isStale: fxIsStale, isUnavailable: fxIsUnavailable, cacheTimestamp: fxCacheTimestamp, refetch: refetchFx } = useExchangeRates();
  const { data: cryptoPrices, dataUpdatedAt: cryptoUpdatedAt, isStale: cryptoIsStale, isUnavailable: cryptoIsUnavailable, message: cryptoMessage, cacheTimestamp, refetch: refetchCrypto, isFetching: cryptoFetching } = useCryptoPrices();
  const saveSnapshot = useSaveSnapshot();
  const { displayCurrency, convertToDisplay, formatInDisplayCurrency } = useCurrency();
  const { config: viewConfig, setConfig: setViewConfig, getIncludedTypes, includesCollections, shouldIncludeAsset } = useViewConfig();
  const { isBlurred, formatBlurred } = useBlur();

  // Get user preferences - default to minimal dashboard
  const favoriteCities: FavoriteCity[] = profile?.favorite_cities || [];
  const dashboardWidgets: string[] = profile?.dashboard_widgets || [];
  const newsSources: string[] = profile?.news_sources || ['bloomberg', 'reuters'];

  const isLoading = assetsLoading || collectionsLoading || liabilitiesLoading;
  const rates = exchangeRates?.rates || fallbackRates;
  const prices = cryptoPrices || {};
  
  // Get included types based on view config
  const includedTypes = getIncludedTypes();
  const showCollections = includesCollections();

  // Helper to get asset value (with live crypto prices)
  const getAssetValue = (asset: typeof assets[0]) => {
    if (asset.type === 'crypto' && asset.ticker && asset.quantity) {
      const cryptoPrice = prices[asset.ticker.toUpperCase()];
      if (cryptoPrice) {
        return cryptoPrice.price * asset.quantity;
      }
    }
    return asset.current_value;
  };

  // Filter assets based on view config and liquidity status
  const filteredAssets = assets.filter(asset => 
    includedTypes.includes(asset.type) && shouldIncludeAsset(asset.liquidity_status)
  );
  const filteredCollections = showCollections ? collections : [];

  // Find personal entity for ownership calculations
  const personalEntity = entities.find(e => e.type === 'personal');
  const personalEntityId = personalEntity?.id || null;

  // Calculate totals using live rates and crypto prices (in EUR for storage)
  // Apply ownership allocation to get user's share only
  const totalAssetsEUR = filteredAssets.reduce((sum, asset) => {
    const value = getAssetValue(asset);
    const eurValue = convertToEUR(value, asset.currency, rates);
    const ownershipShare = getUserOwnershipShare(
      asset.ownership_allocation as { entity_id: string; percentage: number }[] | null,
      personalEntityId
    );
    return sum + (eurValue * ownershipShare);
  }, 0);

  const totalCollectionsEUR = filteredCollections.reduce((sum, item) => {
    const eurValue = convertToEUR(item.current_value, item.currency, rates);
    const ownershipShare = getUserOwnershipShare(
      item.ownership_allocation as { entity_id: string; percentage: number }[] | null,
      personalEntityId
    );
    return sum + (eurValue * ownershipShare);
  }, 0);

  const totalLiabilitiesEUR = liabilities.reduce((sum, item) => {
    const eurValue = convertToEUR(item.current_balance, item.currency, rates);
    return sum + eurValue;
  }, 0);

  const netWorthEUR = totalAssetsEUR + totalCollectionsEUR - totalLiabilitiesEUR;
  
  // Calculate certainty breakdown by level
  const certaintyLevels = ['certain', 'contractual', 'probable', 'optional'] as const;
  
  const assetsBreakdownEUR = certaintyLevels.reduce((acc, level) => {
    acc[level] = filteredAssets
      .filter(a => (a.certainty || 'certain') === level)
      .reduce((sum, asset) => {
        const eurValue = convertToEUR(getAssetValue(asset), asset.currency, rates);
        const ownershipShare = getUserOwnershipShare(
          asset.ownership_allocation as { entity_id: string; percentage: number }[] | null,
          personalEntityId
        );
        return sum + (eurValue * ownershipShare);
      }, 0);
    // Add collections to 'certain' level (they don't have certainty field)
    if (level === 'certain') {
      acc[level] += filteredCollections.reduce((sum, item) => {
        const eurValue = convertToEUR(item.current_value, item.currency, rates);
        const ownershipShare = getUserOwnershipShare(
          item.ownership_allocation as { entity_id: string; percentage: number }[] | null,
          personalEntityId
        );
        return sum + (eurValue * ownershipShare);
      }, 0);
    }
    return acc;
  }, {} as Record<typeof certaintyLevels[number], number>);

  const liabilitiesBreakdownEUR = certaintyLevels.reduce((acc, level) => {
    acc[level] = liabilities
      .filter(l => (l.certainty || 'certain') === level)
      .reduce((sum, item) => sum + convertToEUR(item.current_balance, item.currency, rates), 0);
    return acc;
  }, {} as Record<typeof certaintyLevels[number], number>);

  // Confirmed = certain + contractual, Projected = probable + optional
  const confirmedAssetsEUR = assetsBreakdownEUR.certain + assetsBreakdownEUR.contractual;
  const confirmedLiabilitiesEUR = liabilitiesBreakdownEUR.certain + liabilitiesBreakdownEUR.contractual;
  const confirmedNetWorthEUR = confirmedAssetsEUR - confirmedLiabilitiesEUR;
  const projectedNetWorthEUR = netWorthEUR - confirmedNetWorthEUR;
  
  // Convert to display currency
  const netWorth = convertFromEUR(netWorthEUR, displayCurrency, rates);
  const confirmedNetWorth = convertFromEUR(confirmedNetWorthEUR, displayCurrency, rates);
  const projectedNetWorth = convertFromEUR(projectedNetWorthEUR, displayCurrency, rates);

  // Convert breakdown to display currency for widget
  const assetsBreakdown = {
    certain: convertFromEUR(assetsBreakdownEUR.certain, displayCurrency, rates),
    contractual: convertFromEUR(assetsBreakdownEUR.contractual, displayCurrency, rates),
    probable: convertFromEUR(assetsBreakdownEUR.probable, displayCurrency, rates),
    optional: convertFromEUR(assetsBreakdownEUR.optional, displayCurrency, rates),
  };
  
  const liabilitiesBreakdown = {
    certain: convertFromEUR(liabilitiesBreakdownEUR.certain, displayCurrency, rates),
    contractual: convertFromEUR(liabilitiesBreakdownEUR.contractual, displayCurrency, rates),
    probable: convertFromEUR(liabilitiesBreakdownEUR.probable, displayCurrency, rates),
    optional: convertFromEUR(liabilitiesBreakdownEUR.optional, displayCurrency, rates),
  };


  // Calculate breakdowns (in display currency)
  const assetsByType = [
    { label: 'Real Estate', value: 0, percentage: 0, included: includedTypes.includes('real-estate') },
    { label: 'Investments', value: 0, percentage: 0, included: includedTypes.includes('investment') || includedTypes.includes('crypto') },
    { label: 'Business', value: 0, percentage: 0, included: includedTypes.includes('business') },
    { label: 'Collections', value: convertFromEUR(totalCollectionsEUR, displayCurrency, rates), percentage: 0, included: showCollections },
    { label: 'Cash', value: 0, percentage: 0, included: includedTypes.includes('bank') },
  ];

  // Breakdown by type (in EUR for percentage calc) - apply ownership allocation
  const typeBreakdownEUR: Record<string, number> = { 'Real Estate': 0, 'Investments': 0, 'Business': 0, 'Collections': totalCollectionsEUR, 'Cash': 0 };
  
  filteredAssets.forEach(asset => {
    const value = getAssetValue(asset);
    const eurValue = convertToEUR(value, asset.currency, rates);
    const ownershipShare = getUserOwnershipShare(
      asset.ownership_allocation as { entity_id: string; percentage: number }[] | null,
      personalEntityId
    );
    const adjustedValue = eurValue * ownershipShare;
    if (asset.type === 'real-estate') typeBreakdownEUR['Real Estate'] += adjustedValue;
    else if (asset.type === 'investment' || asset.type === 'crypto') typeBreakdownEUR['Investments'] += adjustedValue;
    else if (asset.type === 'business') typeBreakdownEUR['Business'] += adjustedValue;
    else if (asset.type === 'bank') typeBreakdownEUR['Cash'] += adjustedValue;
  });

  const totalGrossEUR = totalAssetsEUR + totalCollectionsEUR;
  
  assetsByType[0].value = convertFromEUR(typeBreakdownEUR['Real Estate'], displayCurrency, rates);
  assetsByType[1].value = convertFromEUR(typeBreakdownEUR['Investments'], displayCurrency, rates);
  assetsByType[2].value = convertFromEUR(typeBreakdownEUR['Business'], displayCurrency, rates);
  assetsByType[4].value = convertFromEUR(typeBreakdownEUR['Cash'], displayCurrency, rates);
  
  assetsByType.forEach(item => {
    const eurValue = typeBreakdownEUR[item.label] || 0;
    item.percentage = totalGrossEUR > 0 ? (eurValue / totalGrossEUR) * 100 : 0;
  });

  // By country (filtered) - apply ownership allocation
  const countryMapEUR: Record<string, number> = {};
  filteredAssets.forEach(asset => {
    const value = getAssetValue(asset);
    const eurValue = convertToEUR(value, asset.currency, rates);
    const ownershipShare = getUserOwnershipShare(
      asset.ownership_allocation as { entity_id: string; percentage: number }[] | null,
      personalEntityId
    );
    countryMapEUR[asset.country] = (countryMapEUR[asset.country] || 0) + (eurValue * ownershipShare);
  });
  filteredCollections.forEach(item => {
    const eurValue = convertToEUR(item.current_value, item.currency, rates);
    const ownershipShare = getUserOwnershipShare(
      item.ownership_allocation as { entity_id: string; percentage: number }[] | null,
      personalEntityId
    );
    countryMapEUR[item.country] = (countryMapEUR[item.country] || 0) + (eurValue * ownershipShare);
  });

  const assetsByCountry = Object.entries(countryMapEUR)
    .map(([label, eurValue]) => ({
      label: `${getCountryFlag(label)} ${label}`,
      value: convertFromEUR(eurValue, displayCurrency, rates),
      percentage: totalGrossEUR > 0 ? (eurValue / totalGrossEUR) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // By currency (filtered) - apply ownership allocation - include collections
  const currencyMapEUR: Record<string, number> = {};
  filteredAssets.forEach(asset => {
    const value = getAssetValue(asset);
    const eurValue = convertToEUR(value, asset.currency, rates);
    const ownershipShare = getUserOwnershipShare(
      asset.ownership_allocation as { entity_id: string; percentage: number }[] | null,
      personalEntityId
    );
    currencyMapEUR[asset.currency] = (currencyMapEUR[asset.currency] || 0) + (eurValue * ownershipShare);
  });
  // Add collections to currency breakdown
  filteredCollections.forEach(item => {
    const eurValue = convertToEUR(item.current_value, item.currency, rates);
    const ownershipShare = getUserOwnershipShare(
      item.ownership_allocation as { entity_id: string; percentage: number }[] | null,
      personalEntityId
    );
    currencyMapEUR[item.currency] = (currencyMapEUR[item.currency] || 0) + (eurValue * ownershipShare);
  });

  const currencyBreakdown = Object.entries(currencyMapEUR)
    .map(([currency, eurValue]) => ({
      currency,
      percentage: totalGrossEUR > 0 ? (eurValue / totalGrossEUR) * 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Recent assets (last 5 from filtered)
  const recentAssets = filteredAssets.slice(0, 5);

  // Chart data - use ONLY snapshot data
  const chartData = netWorthHistoryData.length > 0 
    ? netWorthHistoryData.map(item => ({
        month: new Date(item.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: convertFromEUR(item.net_worth_eur, displayCurrency, rates),
      }))
    : [];

  // Calculate MTD change
  const previousValue = netWorthHistoryData.length > 1 
    ? netWorthHistoryData[netWorthHistoryData.length - 2]?.net_worth_eur 
    : netWorthEUR;
  const change = previousValue > 0 
    ? ((netWorthEUR - previousValue) / previousValue) * 100 
    : 0;

  // Format last updated times
  const cryptoLastUpdated = cryptoUpdatedAt
    ? new Date(cryptoUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  const handleSaveSnapshot = async () => {
    try {
      await saveSnapshot.mutateAsync({
        total_assets_eur: totalAssetsEUR,
        total_collections_eur: totalCollectionsEUR,
        total_liabilities_eur: totalLiabilitiesEUR,
        net_worth_eur: netWorthEUR,
        breakdown_by_type: typeBreakdownEUR,
        breakdown_by_country: countryMapEUR,
        breakdown_by_currency: currencyMapEUR,
        exchange_rates_snapshot: rates,
        crypto_prices_snapshot: prices,
        certainty_breakdown_assets: assetsBreakdownEUR,
        certainty_breakdown_liabilities: liabilitiesBreakdownEUR,
      });
      toast({
        title: "Snapshot saved",
        description: "Your portfolio value has been recorded for historical tracking.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save snapshot. Please try again.",
      });
    }
  };

  // Helper functions to check widget visibility
  const showWidget = (widgetId: string) => dashboardWidgets.includes(widgetId);

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
  const hasCrypto = assets.some(a => a.type === 'crypto');

  // Format value with blur support
  const formatValue = (value: number, currency: string) => {
    if (isBlurred) return '•••••';
    return formatCurrency(value, currency);
  };

  // Show welcome screen for first-time users
  if (!hasData) {
    const userName = profile?.full_name?.split(' ')[0] || undefined;
    return (
      <AppLayout>
        <OnboardingWizard userName={userName} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 lg:p-12 max-w-7xl">
        {/* Read-only banner when viewing shared portfolio */}
        {isViewingShared && (
          <Alert className="mb-6 bg-secondary border-border">
            <Eye className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Viewing <strong>{sharedOwnerProfile?.full_name || sharedOwnerProfile?.email || 'Shared'}</strong>'s portfolio (read-only)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="h-7 px-2 ml-4"
              >
                <X size={14} className="mr-1" />
                Exit
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* World Clocks Widget */}
        {showWidget('world_clocks') && favoriteCities.length > 0 && (
          <WorldClocksWidget 
            cities={favoriteCities} 
            showWeather={showWidget('weather_with_clocks')}
          />
        )}

        {/* News Ticker */}
        {showWidget('news_ticker') && <NewsTicker enabledSources={newsSources} />}

        {/* Net Worth Card - Always visible */}
        <header className="mb-12">
          {isViewingShared && (
            <p className="text-sm text-muted-foreground mb-2">
              {sharedOwnerProfile?.full_name || 'Shared Portfolio'}
            </p>
          )}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <NetWorthCard 
              totalValue={netWorth} 
              confirmedValue={confirmedNetWorth}
              projectedValue={projectedNetWorth}
              change={change} 
              currency={displayCurrency}
              isBlurred={isBlurred}
            />
            <div className="flex items-center gap-2">
              <CertaintySummary 
                assetsBreakdown={assetsBreakdown}
                totalAssets={netWorth}
              />
              <CertaintyMiniChart data={netWorthHistoryData} />
              <BlurToggle />
              <ViewToggle config={viewConfig} onChange={setViewConfig} />
              <CurrencySwitcher />
              {!isViewingShared && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSaveSnapshot}
                      disabled={saveSnapshot.isPending}
                      className="gap-2"
                    >
                      <Camera size={14} />
                      {saveSnapshot.isPending ? 'Saving...' : 'Snapshot'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save your current portfolio value for accurate historical tracking</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
            {fxIsUnavailable ? (
              <div className="flex items-center gap-1 text-destructive">
                <AlertTriangle size={12} />
                <span>FX rates unavailable</span>
                <button 
                  onClick={() => refetchFx()} 
                  disabled={ratesFetching}
                  className="ml-1 hover:text-foreground transition-colors"
                >
                  <RefreshCw size={12} className={ratesFetching ? 'animate-spin' : ''} />
                </button>
              </div>
            ) : fxIsStale ? (
              <div className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle size={12} />
                <span>
                  Cached FX from {fxCacheTimestamp ? new Date(fxCacheTimestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'earlier'}
                </span>
                <button 
                  onClick={() => refetchFx()} 
                  disabled={ratesFetching}
                  className="ml-1 hover:text-foreground transition-colors"
                  title="Retry fetching live rates"
                >
                  <RefreshCw size={12} className={ratesFetching ? 'animate-spin' : ''} />
                </button>
              </div>
            ) : exchangeRates?.lastUpdated && (
              <div className="flex items-center gap-1">
                <RefreshCw size={12} className={ratesLoading ? 'animate-spin' : ''} />
                <span>FX: {new Date(exchangeRates.lastUpdated).toLocaleDateString()}</span>
              </div>
            )}
            {hasCrypto && (
              <>
                {cryptoIsUnavailable ? (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertTriangle size={12} />
                    <span>Crypto prices unavailable</span>
                    <button 
                      onClick={() => refetchCrypto()} 
                      disabled={cryptoFetching}
                      className="ml-1 hover:text-foreground transition-colors"
                    >
                      <RefreshCw size={12} className={cryptoFetching ? 'animate-spin' : ''} />
                    </button>
                  </div>
                ) : cryptoIsStale ? (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle size={12} />
                    <span>
                      Cached prices from {cacheTimestamp ? new Date(cacheTimestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'earlier'}
                    </span>
                    <button 
                      onClick={() => refetchCrypto()} 
                      disabled={cryptoFetching}
                      className="ml-1 hover:text-foreground transition-colors"
                      title="Retry fetching live prices"
                    >
                      <RefreshCw size={12} className={cryptoFetching ? 'animate-spin' : ''} />
                    </button>
                  </div>
                ) : cryptoLastUpdated && (
                  <div className="flex items-center gap-1">
                    <RefreshCw size={12} />
                    <span>Crypto: {cryptoLastUpdated}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </header>

        {hasData ? (
          <>
            {/* Chart - Always visible */}
            <section className="mb-12">
              {chartData.length > 0 ? (
                <NetWorthChart data={chartData} isBlurred={isBlurred} />
              ) : (
                <div className="p-8 rounded-lg border border-border bg-secondary/20 text-center">
                  <Info size={24} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">No historical data yet</p>
                  <p className="text-sm text-muted-foreground">
                    Save your first snapshot to start tracking your wealth over time.
                  </p>
                </div>
              )}
            </section>

            {/* Collapsible Breakdowns - Always shown but collapsed by default */}
            <CollapsibleProvider>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-sm font-medium text-muted-foreground uppercase tracking-wide">Breakdowns</h3>
                <ExpandCollapseAllButton />
              </div>
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
              <CollapsibleSection id="breakdown_type" title="By Asset Type">
                <BreakdownBar 
                  items={assetsByType.filter(i => i.percentage > 0 && i.included)} 
                  delay={0}
                  isBlurred={isBlurred}
                />
              </CollapsibleSection>
              
              <CollapsibleSection id="breakdown_country" title="By Country">
                <BreakdownBar 
                  items={assetsByCountry} 
                  delay={0}
                  isBlurred={isBlurred}
                />
              </CollapsibleSection>
              
              {currencyBreakdown.length > 0 && (
                <CollapsibleSection id="breakdown_currency" title="By Currency">
                  <CurrencyBreakdown items={currencyBreakdown} delay={0} isBlurred={isBlurred} />
                </CollapsibleSection>
              )}
              
              <CollapsibleSection id="breakdown_entity" title="By Entity">
                <EntityBreakdown delay={0} isBlurred={isBlurred} />
              </CollapsibleSection>
            </section>
            </CollapsibleProvider>

            {/* Optional Widgets - Hidden by default, enable in Settings */}
            {showWidget('certainty_breakdown') && (
              <CertaintyBreakdownWidget
                assetsBreakdown={assetsBreakdown}
                liabilitiesBreakdown={liabilitiesBreakdown}
                currency={displayCurrency}
                isBlurred={isBlurred}
                delay={150}
              />
            )}

            {showWidget('certainty_trend') && netWorthHistoryData.length > 0 && (
              <section className="mb-8 animate-fade-in" style={{ animationDelay: '155ms' }}>
                <h3 className="font-serif text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                  Certainty Trend
                </h3>
                <div className="asset-card">
                  <CertaintyTrendChart 
                    data={netWorthHistoryData}
                    displayCurrency={displayCurrency}
                    convertFromEUR={(value, currency) => convertFromEUR(value, currency, rates)}
                  />
                </div>
              </section>
            )}

            {showWidget('debt_to_income') && (
              <DebtToIncomeWidget isBlurred={isBlurred} delay={175} />
            )}

            {showWidget('net_worth_projection') && (
              <NetWorthProjectionWidget 
                currentNetWorth={netWorth}
                currency={displayCurrency}
                monthlyIncome={profile?.monthly_income || 0}
                isBlurred={isBlurred}
                delay={180}
              />
            )}

            {showWidget('expiring_documents') && <ExpiringDocumentsWidget />}

            {showWidget('leasehold_reminders') && <LeaseholdRemindersWidget assets={assets} />}

            {showWidget('pending_receivables') && <PendingReceivablesWidget isBlurred={isBlurred} />}

            {showWidget('upcoming_loan_payments') && <UpcomingLoanPaymentsWidget isBlurred={isBlurred} />}

            {/* Collections Gallery - only show if collections are included */}
            {showCollections && <CollectionsGallery collections={collections} isBlurred={isBlurred} />}

            {/* Recent Updates */}
            {recentAssets.length > 0 && (
              <section>
                <h3 className="font-serif text-lg font-medium text-foreground mb-6">Recent Updates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {recentAssets.map((asset, index) => (
                    <AssetCard 
                      key={asset.id} 
                      asset={asset} 
                      rates={rates}
                      cryptoPrices={prices}
                      displayCurrency={displayCurrency}
                      delay={500 + (index * 100)}
                      isBlurred={isBlurred}
                      entities={entities}
                    />
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
