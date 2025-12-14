import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AssetCard } from '@/components/assets/AssetCard';
import { useDemo } from '@/contexts/DemoContext';
import { fallbackRates } from '@/lib/currency';

// Demo crypto prices (static for demo purposes)
const demoCryptoPrices = {
  BTC: { price: 100000, change24h: 2.5 },
  ETH: { price: 3500, change24h: 1.2 },
  SOL: { price: 180, change24h: 3.1 },
  USDT: { price: 1, change24h: 0 },
  USDC: { price: 1, change24h: 0 },
};
import { cn } from '@/lib/utils';
import { Search, Info, Ruler, LayoutGrid, List, ArrowUpDown, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Asset } from '@/hooks/useAssets';
import { DemoEditAssetDialog } from '@/components/demo/DemoEditAssetDialog';
import { DemoDeleteAssetDialog } from '@/components/demo/DemoDeleteAssetDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type FilterType = 'all' | 'real-estate' | 'bank' | 'investment' | 'crypto' | 'business';
type SortOption = 'name' | 'value-desc' | 'value-asc' | 'date-desc' | 'date-asc';
type ViewMode = 'grid' | 'list';
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

const DemoAssetsPage = () => {
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
  
  const { assets, entities, profile, updateProfile } = useDemo();
  const rates = fallbackRates;
  const prices = demoCryptoPrices;
  const areaUnit = profile?.area_unit || 'sqm';

  const toggleAreaUnit = () => {
    updateProfile({ area_unit: areaUnit === 'sqm' ? 'sqft' : 'sqm' });
  };

  const filteredAndSortedAssets = useMemo(() => {
    let result = assets
      .filter(a => filter === 'all' || a.type === filter)
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
        return a.property_type === propertyTypeFilter;
      })
      .filter(a => {
        if (!minRooms) return true;
        if (a.type !== 'real-estate') return true;
        return (a.rooms || 0) >= parseInt(minRooms);
      })
      .filter(a => {
        if (!minSize) return true;
        if (a.type !== 'real-estate') return true;
        const minSizeNum = parseFloat(minSize);
        const assetSizeSqm = a.size_sqm || 0;
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
  }, [assets, filter, searchQuery, propertyTypeFilter, minRooms, minSize, areaUnit, sortBy, certaintyFilter]);

  return (
    <AppLayout isDemo>
      <div className="p-8 lg:p-12 max-w-7xl">
        {/* Demo Banner */}
        <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3">
          <Info size={16} className="text-primary flex-shrink-0" />
          <span className="text-sm text-muted-foreground">
            Mode démo — Les modifications sont temporaires
          </span>
          <Badge variant="outline" className="text-xs ml-auto">Demo</Badge>
        </div>

        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Assets</h1>
              <p className="text-muted-foreground">Your wealth portfolio across all categories.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAreaUnit}
                className="flex items-center gap-2"
              >
                <Ruler size={14} />
                {areaUnit === 'sqm' ? 'm²' : 'sq ft'}
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/demo/add">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Asset
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>Using demo exchange rates</span>
          </div>
        </header>

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

        {/* Assets Grid/List */}
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            : "flex flex-col gap-3"
        )}>
          {filteredAndSortedAssets.map((asset, index) => (
            <AssetCard 
              key={asset.id} 
              asset={asset as any} 
              rates={rates}
              cryptoPrices={prices}
              delay={index * 50}
              onEdit={setEditingAsset as any}
              onDelete={setDeletingAsset as any}
              entities={entities as any}
              areaUnit={areaUnit}
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
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <DemoEditAssetDialog
        asset={editingAsset}
        open={!!editingAsset}
        onOpenChange={(open) => !open && setEditingAsset(null)}
      />

      {/* Delete Dialog */}
      <DemoDeleteAssetDialog
        asset={deletingAsset}
        open={!!deletingAsset}
        onOpenChange={(open) => !open && setDeletingAsset(null)}
      />
    </AppLayout>
  );
};

export default DemoAssetsPage;