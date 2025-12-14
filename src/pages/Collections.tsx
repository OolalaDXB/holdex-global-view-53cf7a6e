import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CollectionCard } from '@/components/collections/CollectionCard';
import { EditCollectionDialog } from '@/components/collections/EditCollectionDialog';
import { DeleteCollectionDialog } from '@/components/collections/DeleteCollectionDialog';
import { useCollections, Collection } from '@/hooks/useCollections';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { fallbackRates } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Search, LayoutGrid, List, Rows3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type ViewMode = 'grid' | 'list' | 'compact';

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

const CollectionsPage = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [certaintyFilter, setCertaintyFilter] = useState<CertaintyFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);
  
  const { data: collections = [], isLoading } = useCollections();
  const { data: exchangeRates } = useExchangeRates();
  
  const rates = exchangeRates?.rates || fallbackRates;

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
      const cert = (c as any).certainty || 'probable';
      if (certaintyFilter === 'certain') return cert === 'certain';
      if (certaintyFilter === 'exclude-optional') return cert !== 'optional';
      return true;
    });

  return (
    <AppLayout>
      <div className="p-8 lg:p-12 max-w-7xl">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Collections</h1>
          <p className="text-muted-foreground">Your curated collection of fine objects and alternative investments.</p>
        </header>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
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
