import { useState, useMemo } from 'react';
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
import { AlertTriangle } from 'lucide-react';
import { RefreshCw, Search, X, LayoutGrid, List, ArrowUpDown, Plus, Rows3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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

const AssetsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const entityFilter = searchParams.get('entity');
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  
  // Property filters
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const [minRooms, setMinRooms] = useState('');
  const [minSize, setMinSize] = useState('');
  
  // Sorting and view
  const [sortBy, setSortBy] = useState<SortOption>('value-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [certaintyFilter, setCertaintyFilter] = useState<CertaintyFilter>('all');
  
  const { data: assets = [], isLoading } = useAssets();
  const { data: entities = [] } = useEntities();
  const { data: exchangeRates } = useExchangeRates();
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
        if (propertyTypeFilter === 'all') return true;
        if (a.type !== 'real-estate') return filter !== 'real-estate';
        return (a as any).property_type === propertyTypeFilter;
      })
      .filter(a => {
        if (!minRooms) return true;
        if (a.type !== 'real-estate') return true;
        return ((a as any).rooms || 0) >= parseInt(minRooms);
      })
      .filter(a => {
        if (!minSize) return true;
        if (a.type !== 'real-estate') return true;
        const minSizeNum = parseFloat(minSize);
        const assetSizeSqm = (a as any).size_sqm || 0;
        const compareSize = areaUnit === 'sqft' ? minSizeNum / 10.7639 : minSizeNum;
        return assetSizeSqm >= compareSize;
      })
      .filter(a => {
        if (certaintyFilter === 'all') return true;
        const cert = a.certainty || 'certain';
        if (certaintyFilter === 'certain') return cert === 'certain';
        if (certaintyFilter === 'exclude-optional') return cert !== 'optional';
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
  }, [assets, filter, entityFilter, searchQuery, propertyTypeFilter, minRooms, minSize, areaUnit, sortBy, certaintyFilter]);

  const hasCryptoAssets = assets.some(a => a.type === 'crypto');
  const lastCryptoUpdate = dataUpdatedAt 
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <AppLayout>
      <div className="p-8 lg:p-12 max-w-7xl">
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
        
        {hasCryptoAssets && (
          <div className="flex items-center gap-2 mb-4 text-xs">
            {cryptoIsUnavailable ? (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle size={12} />
                Crypto prices unavailable - values may be inaccurate
                <button 
                  onClick={() => refetchCrypto()} 
                  disabled={cryptoFetching}
                  className="ml-1 hover:text-foreground transition-colors"
                >
                  <RefreshCw size={12} className={cryptoFetching ? 'animate-spin' : ''} />
                </button>
              </span>
            ) : cryptoIsStale ? (
              <span className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle size={12} />
                Cached prices from {cacheTimestamp ? new Date(cacheTimestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'earlier'}
                <button 
                  onClick={() => refetchCrypto()} 
                  disabled={cryptoFetching}
                  className="ml-1 hover:text-foreground transition-colors"
                  title="Retry fetching live prices"
                >
                  <RefreshCw size={12} className={cryptoFetching ? 'animate-spin' : ''} />
                </button>
              </span>
            ) : lastCryptoUpdate && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <RefreshCw size={12} className={cryptoLoading ? 'animate-spin' : ''} />
                Digital asset prices updated at {lastCryptoUpdate}
              </span>
            )}
          </div>
        )}

        {/* Search and Filters */}
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

            {/* Certainty filter */}
            <Select value={certaintyFilter} onValueChange={(v) => setCertaintyFilter(v as CertaintyFilter)}>
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {certaintyFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View toggle */}
            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
              <ToggleGroupItem value="grid" aria-label="Grid view" className="px-3">
                <LayoutGrid size={16} />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view" className="px-3">
                <List size={16} />
              </ToggleGroupItem>
              <ToggleGroupItem value="compact" aria-label="Compact view" className="px-3">
                <Rows3 size={16} />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
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

          {/* Property-specific filters */}
          {(filter === 'all' || filter === 'real-estate') && (
            <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Type:</span>
                <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                  <SelectTrigger className="w-32 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="penthouse">Penthouse</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
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
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Loading assets...</p>
          </div>
        ) : (
          <>
            {/* Assets Grid/List/Compact */}
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                : viewMode === 'compact'
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                  : "flex flex-col gap-3"
            )}>
              {filteredAndSortedAssets.map((asset, index) => (
                <AssetCard 
                  key={asset.id} 
                  asset={asset} 
                  rates={rates}
                  cryptoPrices={prices}
                  displayCurrency={displayCurrency}
                  delay={index * 50}
                  onEdit={setEditingAsset}
                  onDelete={setDeletingAsset}
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