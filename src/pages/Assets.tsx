import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AssetCard } from '@/components/assets/AssetCard';
import { EditAssetDialog } from '@/components/assets/EditAssetDialog';
import { DeleteAssetDialog } from '@/components/assets/DeleteAssetDialog';
import { useAssets, Asset } from '@/hooks/useAssets';
import { useEntities } from '@/hooks/useEntities';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useProfile } from '@/hooks/useProfile';
import { useCurrency } from '@/contexts/CurrencyContext';
import { fallbackRates } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Search, X, LayoutGrid, List, ArrowUpDown, Plus, Rows3, SlidersHorizontal, ChevronDown, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DataStatusBadge } from '@/components/ui/data-status-badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const STORAGE_KEY = 'assets-page-preferences';

type FilterType = 'all' | 'real-estate' | 'bank' | 'investment' | 'crypto' | 'business';
type SortOption = 'name' | 'value-desc' | 'value-asc' | 'date-desc' | 'date-asc';
type ViewMode = 'grid' | 'list' | 'compact';
type CertaintyFilter = 'all' | 'certain' | 'exclude-optional';

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All Assets' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'bank', label: 'Bank Accounts' },
  { value: 'investment', label: 'Investments' },
  { value: 'crypto', label: 'Digital Assets' },
  { value: 'business', label: 'Business' },
];

const certaintyFilterOptions: { value: CertaintyFilter; label: string }[] = [
  { value: 'all', label: 'All Certainty' },
  { value: 'certain', label: 'Certain Only' },
  { value: 'exclude-optional', label: 'Exclude Optional' },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'value-desc', label: 'Value (High to Low)' },
  { value: 'value-asc', label: 'Value (Low to High)' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
];

const propertyTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'office', label: 'Office' },
  { value: 'land', label: 'Land' },
];

const tenureTypeOptions = [
  { value: 'all', label: 'All Tenure' },
  { value: 'freehold', label: 'Freehold' },
  { value: 'leasehold', label: 'Leasehold' },
  { value: 'share_of_freehold', label: 'Share of Freehold' },
];

const AssetsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const entityFilter = searchParams.get('entity');
  
  // Load saved preferences from localStorage
  const savedPrefs = useMemo(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);
  
  const [filter, setFilter] = useState<FilterType>(savedPrefs.filter || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  
  // Sorting and view
  const [sortBy, setSortBy] = useState<SortOption>(savedPrefs.sortBy || 'value-desc');
  const [viewMode, setViewMode] = useState<ViewMode>(savedPrefs.viewMode || 'grid');
  const [certaintyFilter, setCertaintyFilter] = useState<CertaintyFilter>(savedPrefs.certaintyFilter || 'all');
  
  // Real Estate filters
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>(savedPrefs.propertyTypeFilter || 'all');
  const [tenureTypeFilter, setTenureTypeFilter] = useState<string>(savedPrefs.tenureTypeFilter || 'all');
  const [minRooms, setMinRooms] = useState(savedPrefs.minRooms || '');
  const [minSize, setMinSize] = useState(savedPrefs.minSize || '');
  
  // Investment filters
  const [platformFilter, setPlatformFilter] = useState<string>(savedPrefs.platformFilter || 'all');
  const [performanceFilter, setPerformanceFilter] = useState<string>(savedPrefs.performanceFilter || 'all');
  
  // Crypto filters
  const [tickerFilter, setTickerFilter] = useState<string>(savedPrefs.tickerFilter || 'all');
  
  // Bank filters
  const [institutionFilter, setInstitutionFilter] = useState<string>(savedPrefs.institutionFilter || 'all');
  
  // Business filters
  const [countryFilter, setCountryFilter] = useState<string>(savedPrefs.countryFilter || 'all');
  const [ownershipFilter, setOwnershipFilter] = useState<string>(savedPrefs.ownershipFilter || 'all');
  
  // Filters panel
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Persist preferences to localStorage
  useEffect(() => {
    const prefs = {
      filter,
      sortBy,
      viewMode,
      certaintyFilter,
      propertyTypeFilter,
      tenureTypeFilter,
      minRooms,
      minSize,
      platformFilter,
      performanceFilter,
      tickerFilter,
      institutionFilter,
      countryFilter,
      ownershipFilter,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [filter, sortBy, viewMode, certaintyFilter, propertyTypeFilter, tenureTypeFilter, minRooms, minSize, platformFilter, performanceFilter, tickerFilter, institutionFilter, countryFilter, ownershipFilter]);
  
  // Clear all filters function
  const clearAllFilters = () => {
    setCertaintyFilter('all');
    setPropertyTypeFilter('all');
    setTenureTypeFilter('all');
    setMinRooms('');
    setMinSize('');
    setPlatformFilter('all');
    setPerformanceFilter('all');
    setTickerFilter('all');
    setInstitutionFilter('all');
    setCountryFilter('all');
    setOwnershipFilter('all');
    setViewMode('grid');
  };
  
  const { data: assets = [], isLoading } = useAssets();
  const { data: entities = [] } = useEntities();
  const { data: exchangeRates, isStale: fxIsStale, isUnavailable: fxIsUnavailable, cacheTimestamp: fxCacheTimestamp, refetch: refetchFx, isFetching: fxFetching } = useExchangeRates();
  const { data: cryptoPrices, isLoading: cryptoLoading, dataUpdatedAt, isStale: cryptoIsStale, isUnavailable: cryptoIsUnavailable, cacheTimestamp, refetch: refetchCrypto, isFetching: cryptoFetching } = useCryptoPrices();
  const { data: profile } = useProfile();
  const { displayCurrency } = useCurrency();
  
  const rates = exchangeRates?.rates || fallbackRates;
  const prices = cryptoPrices || {};
  const areaUnit = (profile as any)?.area_unit || 'sqm';

  const clearEntityFilter = () => {
    setSearchParams({});
  };

  const getEntityName = (entityId: string) => {
    if (entityId === 'unassigned') return 'Unassigned';
    const entity = entities.find(e => e.id === entityId);
    return entity?.name || 'Unknown Entity';
  };

  // Unique values for dynamic filter options
  const uniquePlatforms = useMemo(() => {
    const platforms = assets.filter(a => a.type === 'investment').map(a => a.platform).filter(Boolean);
    return ['all', ...Array.from(new Set(platforms))];
  }, [assets]);
  
  const uniqueTickers = useMemo(() => {
    const tickers = assets.filter(a => a.type === 'crypto').map(a => a.ticker).filter(Boolean);
    return ['all', ...Array.from(new Set(tickers))];
  }, [assets]);
  
  const uniqueInstitutions = useMemo(() => {
    const institutions = assets.filter(a => a.type === 'bank').map(a => a.institution).filter(Boolean);
    return ['all', ...Array.from(new Set(institutions))];
  }, [assets]);
  
  const uniqueCountries = useMemo(() => {
    const countries = assets.filter(a => a.type === 'business').map(a => a.country).filter(Boolean);
    return ['all', ...Array.from(new Set(countries))];
  }, [assets]);

  // Count active filters based on current type
  const activeFilterCount = useMemo(() => {
    let count = 0;
    // Common filters
    if (certaintyFilter !== 'all') count++;
    if (viewMode !== 'grid') count++;
    
    // Type-specific filters
    if (filter === 'real-estate') {
      if (propertyTypeFilter !== 'all') count++;
      if (tenureTypeFilter !== 'all') count++;
      if (minRooms !== '') count++;
      if (minSize !== '') count++;
    } else if (filter === 'investment') {
      if (platformFilter !== 'all') count++;
      if (performanceFilter !== 'all') count++;
    } else if (filter === 'crypto') {
      if (tickerFilter !== 'all') count++;
    } else if (filter === 'bank') {
      if (institutionFilter !== 'all') count++;
    } else if (filter === 'business') {
      if (countryFilter !== 'all') count++;
      if (ownershipFilter !== 'all') count++;
    }
    return count;
  }, [filter, certaintyFilter, viewMode, propertyTypeFilter, tenureTypeFilter, minRooms, minSize, platformFilter, performanceFilter, tickerFilter, institutionFilter, countryFilter, ownershipFilter]);

  const filteredAndSortedAssets = useMemo(() => {
    let result = assets
      .filter(a => filter === 'all' || a.type === filter)
      .filter(a => {
        if (!entityFilter) return true;
        if (entityFilter === 'unassigned') return !a.entity_id;
        return a.entity_id === entityFilter;
      })
      .filter(a => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          a.name.toLowerCase().includes(query) ||
          a.institution?.toLowerCase().includes(query) ||
          a.ticker?.toLowerCase().includes(query) ||
          a.country.toLowerCase().includes(query)
        );
      })
      .filter(a => {
        if (certaintyFilter === 'all') return true;
        const cert = a.certainty || 'certain';
        if (certaintyFilter === 'certain') return cert === 'certain';
        if (certaintyFilter === 'exclude-optional') return cert !== 'optional';
        return true;
      })
      // Real Estate filters
      .filter(a => {
        if (filter !== 'real-estate') return true;
        if (propertyTypeFilter !== 'all' && (a as any).property_type !== propertyTypeFilter) return false;
        if (tenureTypeFilter !== 'all' && (a as any).tenure_type !== tenureTypeFilter) return false;
        if (minRooms && ((a as any).rooms || 0) < parseInt(minRooms)) return false;
        if (minSize) {
          const minSizeNum = parseFloat(minSize);
          const assetSizeSqm = (a as any).size_sqm || 0;
          const compareSize = areaUnit === 'sqft' ? minSizeNum / 10.7639 : minSizeNum;
          if (assetSizeSqm < compareSize) return false;
        }
        return true;
      })
      // Investment filters
      .filter(a => {
        if (filter !== 'investment') return true;
        if (platformFilter !== 'all' && a.platform !== platformFilter) return false;
        if (performanceFilter !== 'all') {
          const purchaseValue = a.purchase_value || a.current_value;
          const performance = purchaseValue > 0 ? ((a.current_value - purchaseValue) / purchaseValue) * 100 : 0;
          if (performanceFilter === 'positive' && performance <= 0) return false;
          if (performanceFilter === 'negative' && performance >= 0) return false;
        }
        return true;
      })
      // Crypto filters
      .filter(a => {
        if (filter !== 'crypto') return true;
        if (tickerFilter !== 'all' && a.ticker !== tickerFilter) return false;
        return true;
      })
      // Bank filters
      .filter(a => {
        if (filter !== 'bank') return true;
        if (institutionFilter !== 'all' && a.institution !== institutionFilter) return false;
        return true;
      })
      // Business filters
      .filter(a => {
        if (filter !== 'business') return true;
        if (countryFilter !== 'all' && a.country !== countryFilter) return false;
        if (ownershipFilter !== 'all') {
          const ownership = (a as any).ownership_percentage || 100;
          if (ownershipFilter === 'majority' && ownership < 50) return false;
          if (ownershipFilter === 'minority' && ownership >= 50) return false;
        }
        return true;
      });

    // Sorting
    switch (sortBy) {
      case 'name':
        result = result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'value-desc':
        result = result.sort((a, b) => b.current_value - a.current_value);
        break;
      case 'value-asc':
        result = result.sort((a, b) => a.current_value - b.current_value);
        break;
      case 'date-desc':
        result = result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
      case 'date-asc':
        result = result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        break;
    }

    return result;
  }, [assets, filter, entityFilter, searchQuery, certaintyFilter, propertyTypeFilter, tenureTypeFilter, minRooms, minSize, areaUnit, platformFilter, performanceFilter, tickerFilter, institutionFilter, countryFilter, ownershipFilter, sortBy]);

  const hasCryptoAssets = assets.some(a => a.type === 'crypto');
  const lastCryptoUpdate = dataUpdatedAt 
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-12 max-w-7xl">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Assets</h1>
            <p className="text-muted-foreground">Your wealth portfolio across all categories.</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/add">
              <Plus className="h-4 w-4 mr-1" />
              Add Asset
            </Link>
          </Button>
        </header>
        
        {entityFilter && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Filtered by:</span>
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm">
              <span>{getEntityName(entityFilter)}</span>
              <button
                onClick={clearEntityFilter}
                className="ml-1 p-0.5 hover:bg-muted rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
        
        {/* Status warnings */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <DataStatusBadge
            label="FX"
            status={fxIsUnavailable ? 'unavailable' : fxIsStale ? 'stale' : 'live'}
            lastUpdated={exchangeRates?.lastUpdated}
            cacheTimestamp={fxCacheTimestamp}
            isFetching={fxFetching}
            onRefresh={refetchFx}
          />
          {hasCryptoAssets && (
            <DataStatusBadge
              label="Crypto"
              status={cryptoIsUnavailable ? 'unavailable' : cryptoIsStale ? 'stale' : 'live'}
              lastUpdated={dataUpdatedAt}
              cacheTimestamp={cacheTimestamp}
              isFetching={cryptoFetching}
              onRefresh={refetchCrypto}
            />
          )}
        </div>

        {/* Simplified Header: Search + Sort + Filters button */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>
            
            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-muted-foreground" />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-44 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filters button */}
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <SlidersHorizontal size={14} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                  <ChevronDown size={14} className={cn("transition-transform", filtersOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>

          {/* Collapsible Filters Panel */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent>
              <div className="p-4 bg-secondary/50 rounded-lg border border-border space-y-4">
                {/* Common filters row */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Certainty filter - shown for all types */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Certainty:</span>
                    <Select value={certaintyFilter} onValueChange={(v) => setCertaintyFilter(v as CertaintyFilter)}>
                      <SelectTrigger className="w-40 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {certaintyFilterOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* View toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">View:</span>
                    <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
                      <ToggleGroupItem value="grid" aria-label="Grid view" className="px-3 h-8">
                        <LayoutGrid size={14} />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="list" aria-label="List view" className="px-3 h-8">
                        <List size={14} />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="compact" aria-label="Compact view" className="px-3 h-8">
                        <Rows3 size={14} />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>

                {/* Real Estate specific filters */}
                {filter === 'real-estate' && (
                  <div className="flex flex-wrap gap-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Property type:</span>
                      <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                        <SelectTrigger className="w-32 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {propertyTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Tenure:</span>
                      <Select value={tenureTypeFilter} onValueChange={setTenureTypeFilter}>
                        <SelectTrigger className="w-36 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tenureTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Min rooms:</span>
                      <Input
                        type="number"
                        min="0"
                        value={minRooms}
                        onChange={(e) => setMinRooms(e.target.value)}
                        className="w-16 h-8 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Min size:</span>
                      <Input
                        type="number"
                        min="0"
                        value={minSize}
                        onChange={(e) => setMinSize(e.target.value)}
                        className="w-20 h-8 text-sm"
                        placeholder="0"
                      />
                      <span className="text-xs text-muted-foreground">{areaUnit === 'sqm' ? 'm²' : 'sq ft'}</span>
                    </div>
                  </div>
                )}

                {/* Investment specific filters */}
                {filter === 'investment' && (
                  <div className="flex flex-wrap gap-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Platform:</span>
                      <Select value={platformFilter} onValueChange={setPlatformFilter}>
                        <SelectTrigger className="w-36 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {uniquePlatforms.map((platform) => (
                            <SelectItem key={platform} value={platform}>
                              {platform === 'all' ? 'All Platforms' : platform}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Performance:</span>
                      <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                        <SelectTrigger className="w-32 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="positive">Positive</SelectItem>
                          <SelectItem value="negative">Negative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Crypto specific filters */}
                {filter === 'crypto' && (
                  <div className="flex flex-wrap gap-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Ticker:</span>
                      <Select value={tickerFilter} onValueChange={setTickerFilter}>
                        <SelectTrigger className="w-32 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueTickers.map((ticker) => (
                            <SelectItem key={ticker} value={ticker}>
                              {ticker === 'all' ? 'All Tickers' : ticker}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Bank specific filters */}
                {filter === 'bank' && (
                  <div className="flex flex-wrap gap-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Institution:</span>
                      <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
                        <SelectTrigger className="w-40 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueInstitutions.map((institution) => (
                            <SelectItem key={institution} value={institution}>
                              {institution === 'all' ? 'All Institutions' : institution}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Business specific filters */}
                {filter === 'business' && (
                  <div className="flex flex-wrap gap-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Country:</span>
                      <Select value={countryFilter} onValueChange={setCountryFilter}>
                        <SelectTrigger className="w-36 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueCountries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country === 'all' ? 'All Countries' : country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Ownership:</span>
                      <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
                        <SelectTrigger className="w-32 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="majority">Majority (≥50%)</SelectItem>
                          <SelectItem value="minority">Minority (&lt;50%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Clear all filters button */}
                {activeFilterCount > 0 && (
                  <div className="pt-3 border-t border-border">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearAllFilters}
                      className="h-8 text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw size={14} className="mr-2" />
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                  filter === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Loading assets...</p>
          </div>
        ) : (
          <>
            {/* Assets Grid/List/Compact - auto compact on mobile */}
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
                : viewMode === 'compact'
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3"
                  : "flex flex-col gap-2 sm:gap-3"
            )}>
              {filteredAndSortedAssets.map((asset, index) => (
                <AssetCard 
                  key={asset.id} 
                  asset={asset} 
                  rates={rates}
                  cryptoPrices={prices}
                  displayCurrency={displayCurrency}
                  delay={index * 30}
                  onEdit={(a) => setEditingAsset(a as Asset)}
                  onDelete={(a) => setDeletingAsset(a as Asset)}
                  entities={entities}
                  areaUnit={areaUnit}
                  compact={viewMode === 'compact'}
                />
              ))}
            </div>

            {filteredAndSortedAssets.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">
                  {assets.length === 0 
                    ? "No assets yet. Add your first asset to get started." 
                    : searchQuery 
                      ? `No assets found matching "${searchQuery}".`
                      : "No assets found in this category."
                  }
                </p>
                {assets.length === 0 && (
                  <a 
                    href="/add" 
                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Add Asset
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <EditAssetDialog
        asset={editingAsset}
        open={!!editingAsset}
        onOpenChange={(open) => !open && setEditingAsset(null)}
      />

      {/* Delete Dialog */}
      <DeleteAssetDialog
        asset={deletingAsset}
        open={!!deletingAsset}
        onOpenChange={(open) => !open && setDeletingAsset(null)}
      />
    </AppLayout>
  );
};

export default AssetsPage;