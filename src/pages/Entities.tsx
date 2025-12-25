import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Building2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEntities, useCreateEntity, useUpdateEntity, useDeleteEntity, Entity, EntityInsert, ENTITY_TYPES } from '@/hooks/useEntities';
import { useAssets } from '@/hooks/useAssets';
import { useCollections } from '@/hooks/useCollections';
import { useLiabilities } from '@/hooks/useLiabilities';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useProfile } from '@/hooks/useProfile';
import { EntityCard } from '@/components/entities/EntityCard';
import { EntityDialog } from '@/components/entities/EntityDialog';
import { DeleteEntityDialog } from '@/components/entities/DeleteEntityDialog';
import { EntityDetailDrawer } from '@/components/entities/EntityDetailDrawer';
import { convertToEUR } from '@/lib/currency';
import { toast } from '@/hooks/use-toast';
import { parseOwnershipAllocation, getEntityShareFromAllocation } from '@/lib/types';

type FilterType = 'all' | string;

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All Entities' },
  ...ENTITY_TYPES.map(type => ({ value: type.value, label: type.label })),
];

const Entities = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { displayCurrency } = useCurrency();
  const { data: entities, isLoading: entitiesLoading } = useEntities();
  const { data: assets } = useAssets();
  const { data: collections } = useCollections();
  const { data: liabilities } = useLiabilities();
  const { data: exchangeRates } = useExchangeRates();
  const { data: profile } = useProfile();

  const createEntity = useCreateEntity();
  const updateEntity = useUpdateEntity();
  const deleteEntity = useDeleteEntity();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [deletingEntity, setDeletingEntity] = useState<Entity | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  // Get display name for an entity (use profile name for personal entity)
  const getEntityDisplayName = (entity: Entity) => {
    if (entity.type === 'personal' && profile?.full_name) {
      return profile.full_name;
    }
    return entity.name;
  };
  // Calculate stats per entity (considering ownership_allocation for shared assets)
  const entityStats = useMemo(() => {
    if (!entities) return {};
    
    const stats: Record<string, { assetCount: number; totalValue: number }> = {};
    const rates = exchangeRates || {};
    
    entities.forEach((entity) => {
      let assetCount = 0;
      let assetsValue = 0;
      let collectionsValue = 0;
      let liabilitiesValue = 0;

      // Process assets
      assets?.forEach(a => {
        const valueInEur = convertToEUR(Number(a.current_value), a.currency, rates as Record<string, number>);
        const allocation = parseOwnershipAllocation(a.ownership_allocation);
        
        if (allocation && allocation.length > 0) {
          // Shared ownership - check if this entity has a share
          const share = getEntityShareFromAllocation(allocation, entity.id);
          if (share > 0) {
            assetCount += 1;
            assetsValue += valueInEur * share;
          }
        } else if (a.entity_id === entity.id) {
          // Direct ownership via entity_id
          assetCount += 1;
          assetsValue += valueInEur;
        }
      });

      // Process collections
      collections?.forEach(c => {
        const valueInEur = convertToEUR(Number(c.current_value), c.currency, rates as Record<string, number>);
        const allocation = parseOwnershipAllocation(c.ownership_allocation);
        
        if (allocation && allocation.length > 0) {
          const share = getEntityShareFromAllocation(allocation, entity.id);
          if (share > 0) {
            assetCount += 1;
            collectionsValue += valueInEur * share;
          }
        } else if (c.entity_id === entity.id) {
          assetCount += 1;
          collectionsValue += valueInEur;
        }
      });

      // Process liabilities (still use entity_id only)
      liabilities?.filter(l => l.entity_id === entity.id).forEach(l => {
        const valueInEur = convertToEUR(Number(l.current_balance), l.currency, rates as Record<string, number>);
        liabilitiesValue += valueInEur;
      });

      stats[entity.id] = {
        assetCount,
        totalValue: assetsValue + collectionsValue - liabilitiesValue,
      };
    });

    return stats;
  }, [entities, assets, collections, liabilities, exchangeRates]);

  const filteredEntities = useMemo(() => {
    return (entities || [])
      .filter(e => filter === 'all' || e.type === filter)
      .filter(e => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          e.name.toLowerCase().includes(query) ||
          e.legal_name?.toLowerCase().includes(query) ||
          e.country?.toLowerCase().includes(query)
        );
      });
  }, [entities, filter, searchQuery]);

  const handleCreate = async (data: Omit<EntityInsert, 'user_id'>) => {
    try {
      await createEntity.mutateAsync(data);
      toast({ title: 'Entity created', description: `${data.name} has been added.` });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create entity',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleUpdate = async (data: Omit<EntityInsert, 'user_id'>) => {
    if (!editingEntity) return;
    try {
      await updateEntity.mutateAsync({ id: editingEntity.id, ...data });
      toast({ title: 'Entity updated', description: `${data.name} has been updated.` });
      setEditingEntity(null);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update entity',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deletingEntity) return;
    try {
      await deleteEntity.mutateAsync({ id: deletingEntity.id, name: deletingEntity.name });
      toast({ title: 'Entity deleted', description: `${deletingEntity.name} has been removed.` });
      setDeletingEntity(null);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to delete entity',
        variant: 'destructive',
      });
    }
  };

  const hasLinkedAssets = (entityId: string) => {
    const stats = entityStats[entityId];
    return stats ? stats.assetCount > 0 : false;
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-12 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Entities</h1>
              <p className="text-muted-foreground">Manage ownership structures for your assets.</p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entity
            </Button>
          </div>
        </header>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
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

        {entitiesLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Loading entities...</p>
          </div>
        ) : (
          <>
            {/* Entities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntities.map((entity) => {
                const stats = entityStats[entity.id] || { assetCount: 0, totalValue: 0 };
                return (
                  <EntityCard
                    key={entity.id}
                    entity={entity}
                    displayName={getEntityDisplayName(entity)}
                    assetCount={stats.assetCount}
                    totalValue={stats.totalValue}
                    currency={displayCurrency}
                    onEdit={() => setEditingEntity(entity)}
                    onDelete={() => setDeletingEntity(entity)}
                    onClick={() => setSelectedEntity(entity)}
                  />
                );
              })}
            </div>

            {filteredEntities.length === 0 && (
              <div className="text-center py-16">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  {(entities?.length || 0) === 0
                    ? 'No entities yet. Create your first entity to organize asset ownership.'
                    : searchQuery
                      ? `No entities found matching "${searchQuery}".`
                      : 'No entities found in this category.'}
                </p>
                {(entities?.length || 0) === 0 && (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entity
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <EntityDialog
        open={isDialogOpen || !!editingEntity}
        onOpenChange={(open) => {
          if (!open) {
            setIsDialogOpen(false);
            setEditingEntity(null);
          }
        }}
        entity={editingEntity}
        onSave={editingEntity ? handleUpdate : handleCreate}
        isLoading={createEntity.isPending || updateEntity.isPending}
      />

      <DeleteEntityDialog
        open={!!deletingEntity}
        onOpenChange={(open) => !open && setDeletingEntity(null)}
        entity={deletingEntity}
        onConfirm={handleDelete}
        isLoading={deleteEntity.isPending}
        hasLinkedAssets={deletingEntity ? hasLinkedAssets(deletingEntity.id) : false}
      />

      <EntityDetailDrawer
        open={!!selectedEntity}
        onOpenChange={(open) => !open && setSelectedEntity(null)}
        entity={selectedEntity}
        displayName={selectedEntity ? getEntityDisplayName(selectedEntity) : ''}
        assets={assets || []}
        collections={collections || []}
        liabilities={liabilities || []}
        exchangeRates={(exchangeRates as unknown as Record<string, number>) || {}}
        displayCurrency={displayCurrency}
        onEdit={() => {
          setEditingEntity(selectedEntity);
          setSelectedEntity(null);
        }}
      />
    </AppLayout>
  );
};

export default Entities;