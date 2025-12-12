import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';
import { useEntities, useCreateEntity, useUpdateEntity, useDeleteEntity, Entity, EntityInsert } from '@/hooks/useEntities';
import { useAssets } from '@/hooks/useAssets';
import { useCollections } from '@/hooks/useCollections';
import { useLiabilities } from '@/hooks/useLiabilities';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useCurrency } from '@/contexts/CurrencyContext';
import { EntityCard } from '@/components/entities/EntityCard';
import { EntityDialog } from '@/components/entities/EntityDialog';
import { DeleteEntityDialog } from '@/components/entities/DeleteEntityDialog';
import { convertToEUR } from '@/lib/currency';
import { toast } from '@/hooks/use-toast';

const Entities = () => {
  const { displayCurrency } = useCurrency();
  const { data: entities, isLoading: entitiesLoading } = useEntities();
  const { data: assets } = useAssets();
  const { data: collections } = useCollections();
  const { data: liabilities } = useLiabilities();
  const { data: exchangeRates } = useExchangeRates();

  const createEntity = useCreateEntity();
  const updateEntity = useUpdateEntity();
  const deleteEntity = useDeleteEntity();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [deletingEntity, setDeletingEntity] = useState<Entity | null>(null);

  // Calculate stats per entity
  const entityStats = useMemo(() => {
    if (!entities) return {};
    
    const stats: Record<string, { assetCount: number; totalValue: number }> = {};
    
    entities.forEach((entity) => {
      const entityAssets = assets?.filter(a => a.entity_id === entity.id) || [];
      const entityCollections = collections?.filter(c => c.entity_id === entity.id) || [];
      const entityLiabilities = liabilities?.filter(l => l.entity_id === entity.id) || [];

      const rates = exchangeRates || {};
      
      const assetsValue = entityAssets.reduce((sum, a) => {
        const valueInEur = convertToEUR(Number(a.current_value), a.currency, rates as Record<string, number>);
        return sum + valueInEur;
      }, 0);

      const collectionsValue = entityCollections.reduce((sum, c) => {
        const valueInEur = convertToEUR(Number(c.current_value), c.currency, rates as Record<string, number>);
        return sum + valueInEur;
      }, 0);

      const liabilitiesValue = entityLiabilities.reduce((sum, l) => {
        const valueInEur = convertToEUR(Number(l.current_balance), l.currency, rates as Record<string, number>);
        return sum + valueInEur;
      }, 0);

      stats[entity.id] = {
        assetCount: entityAssets.length + entityCollections.length,
        totalValue: assetsValue + collectionsValue - liabilitiesValue,
      };
    });

    return stats;
  }, [entities, assets, collections, liabilities, exchangeRates]);

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
      await deleteEntity.mutateAsync(deletingEntity.id);
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-foreground">Entities</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage ownership structures for your assets
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entity
          </Button>
        </div>

        {entitiesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : entities?.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No entities yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first entity to organize asset ownership
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entity
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entities?.map((entity) => {
              const stats = entityStats[entity.id] || { assetCount: 0, totalValue: 0 };
              return (
                <EntityCard
                  key={entity.id}
                  entity={entity}
                  assetCount={stats.assetCount}
                  totalValue={stats.totalValue}
                  currency={displayCurrency}
                  onEdit={() => setEditingEntity(entity)}
                  onDelete={() => setDeletingEntity(entity)}
                />
              );
            })}
          </div>
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
    </AppLayout>
  );
};

export default Entities;
