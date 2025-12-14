import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CollectionCard } from '@/components/collections/CollectionCard';
import { EditCollectionDialog } from '@/components/collections/EditCollectionDialog';
import { DeleteCollectionDialog } from '@/components/collections/DeleteCollectionDialog';
import { useCollections, Collection } from '@/hooks/useCollections';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useCurrency } from '@/contexts/CurrencyContext';
import { fallbackRates } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Search, LayoutGrid, List, Rows3, ArrowUpDown, SlidersHorizontal, ChevronDown, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DataStatusBadge } from '@/components/ui/data-status-badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const STORAGE_KEY = 'collections-page-preferences';

type ViewMode = 'grid' | 'list' | 'compact';
type SortOption = 'name' | 'value-desc' | 'value-asc' | 'date-desc' | 'date-asc';
type FilterType = 'all' | 'watch' | 'vehicle' | 'art' | 'jewelry' | 'wine' | 'vinyl' | 'other';
type CertaintyFilter = 'all' | 'certain' | 'exclude-optional';

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'watch', label: 'Watches' },
  { value: 'vehicle', label: 'Vehicles' },
  { value: 'art', label: 'Art' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'wine', label: 'Wine' },
  { value: 'vinyl', label: 'Vinyls' },
  { value: 'other', label: 'Other' },
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

const CollectionsPage = () => {
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
  const [certaintyFilter, setCertaintyFilter] = useState<CertaintyFilter>(savedPrefs.certaintyFilter || 'all');
  const [viewMode, setViewMode] = useState<ViewMode>(savedPrefs.viewMode || 'grid');
  const [sortBy, setSortBy] = useState<SortOption>(savedPrefs.sortBy || 'value-desc');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);
  
  // Persist preferences to localStorage
  useEffect(() => {
    const prefs = { filter, sortBy, viewMode, certaintyFilter };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [filter, sortBy, viewMode, certaintyFilter]);
  
  // Clear all filters function
  const clearAllFilters = () => {
    setCertaintyFilter('all');
    setViewMode('grid');
  };
  
  const { data: collections = [], isLoading } = useCollections();
  const { 
    data: exchangeRates, 
    isStale: fxIsStale, 
    isUnavailable: fxIsUnavailable, 
    cacheTimestamp: fxCacheTimestamp,
    isFetching: fxFetching,
    refetch: refetchFx 
  } = useExchangeRates();
  const { displayCurrency } = useCurrency();
  
  const rates = exchangeRates?.rates || fallbackRates;

  // Count active filters
  const activeFilterCount = [
    certaintyFilter !== 'all',
    viewMode !== 'grid',
  ].filter(Boolean).length;

  const filteredCollections = collections
    .filter(c => filter === 'all' || c.type === filter)
    .filter(c => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(query) ||
        c.brand?.toLowerCase().includes(query) ||
        c.model?.toLowerCase().includes(query) ||
        c.country.toLowerCase().includes(query) ||
        c.notes?.toLowerCase().includes(query)
      );
    })
    .filter(c => {
      if (certaintyFilter === 'all') return true;
      const cert = c.certainty ?? 'probable';
      if (certaintyFilter === 'certain') return cert === 'certain';
      if (certaintyFilter === 'exclude-optional') return cert !== 'optional';
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'value-desc':
          return b.current_value - a.current_value;
        case 'value-asc':
          return a.current_value - b.current_value;
        case 'date-desc':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'date-asc':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        default:
          return 0;
      }
    });

  return (
    <AppLayout>
      <div className="p-8 lg:p-12 max-w-7xl">
        <header className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Collections</h1>
              <p className="text-muted-foreground">Your curated collection of fine objects and alternative investments.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <DataStatusBadge
              label="FX"
              status={fxIsUnavailable ? 'unavailable' : fxIsStale ? 'stale' : 'live'}
              lastUpdated={exchangeRates?.lastUpdated}
              cacheTimestamp={fxCacheTimestamp}
              isFetching={fxFetching}
              onRefresh={refetchFx}
            />
          </div>
        </header>

        {/* Simplified Header: Search + Sort + Filters button */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search collections..."
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
                <div className="flex flex-wrap items-center gap-4">
                  {/* Certainty filter */}
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
            <p className="text-muted-foreground">Loading collections...</p>
          </div>
        ) : (
          <>
            {/* Collections Grid/List/Compact */}
            <div className={cn(
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : viewMode === 'compact'
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                  : "flex flex-col gap-3"
            )}>
              {filteredCollections.map((collection, index) => (
                <CollectionCard 
                  key={collection.id} 
                  collection={collection} 
                  rates={rates}
                  displayCurrency={displayCurrency}
                  delay={index * 50}
                  onEdit={setEditingCollection}
                  onDelete={setDeletingCollection}
                  compact={viewMode === 'compact'}
                />
              ))}
            </div>

            {filteredCollections.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">
                  {collections.length === 0 
                    ? "No collections yet. Add your first piece to get started." 
                    : searchQuery
                      ? `No items found matching "${searchQuery}".`
                      : "No items found in this category."
                  }
                </p>
                {collections.length === 0 && (
                  <a 
                    href="/add" 
                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Add Collection Item
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <EditCollectionDialog
        collection={editingCollection}
        open={!!editingCollection}
        onOpenChange={(open) => !open && setEditingCollection(null)}
      />

      {/* Delete Dialog */}
      <DeleteCollectionDialog
        collection={deletingCollection}
        open={!!deletingCollection}
        onOpenChange={(open) => !open && setDeletingCollection(null)}
      />
    </AppLayout>
  );
};

export default CollectionsPage;