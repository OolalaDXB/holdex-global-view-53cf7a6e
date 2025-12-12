import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Info, Building, User, Users, Briefcase, Building2, ShieldCheck, Home, Heart } from 'lucide-react';
import { useDemo } from '@/contexts/DemoContext';

const ENTITY_TYPES = [
  { value: 'personal', label: 'Personal', icon: '👤' },
  { value: 'spouse', label: 'Spouse', icon: '💑' },
  { value: 'couple', label: 'Couple', icon: '👫' },
  { value: 'company', label: 'Company', icon: '🏢' },
  { value: 'holding', label: 'Holding', icon: '🏛️' },
  { value: 'spv', label: 'SPV', icon: '📋' },
  { value: 'trust', label: 'Trust', icon: '🛡️' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
] as const;

const DemoEntitiesPage = () => {
  const { entities, assets, collections, liabilities } = useDemo();

  const getEntityAssetCount = (entityId: string) => {
    const assetCount = assets.filter(a => a.entity_id === entityId).length;
    const collectionCount = collections.filter(c => c.entity_id === entityId).length;
    const liabilityCount = liabilities.filter(l => l.entity_id === entityId).length;
    return assetCount + collectionCount + liabilityCount;
  };

  const getEntityTotalValue = (entityId: string) => {
    const assetValue = assets
      .filter(a => a.entity_id === entityId)
      .reduce((sum, a) => sum + a.current_value, 0);
    const collectionValue = collections
      .filter(c => c.entity_id === entityId)
      .reduce((sum, c) => sum + c.current_value, 0);
    const liabilityValue = liabilities
      .filter(l => l.entity_id === entityId)
      .reduce((sum, l) => sum + l.current_balance, 0);
    return assetValue + collectionValue - liabilityValue;
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AppLayout isDemo>
      <div className="p-8 lg:p-12">
        {/* Demo Banner */}
        <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3">
          <Info size={16} className="text-primary flex-shrink-0" />
          <span className="text-sm text-muted-foreground">
            Demo mode — Changes are temporary
          </span>
          <Badge variant="outline" className="text-xs ml-auto">Demo</Badge>
        </div>

        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Entities</h1>
            <p className="text-muted-foreground">Manage ownership structures for your wealth.</p>
          </div>
          <Button disabled className="gap-2">
            <Plus size={18} />
            Add Entity
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entities.map((entity) => {
            const typeInfo = ENTITY_TYPES.find(t => t.value === entity.type);
            const assetCount = getEntityAssetCount(entity.id);
            const totalValue = getEntityTotalValue(entity.id);

            return (
              <div
                key={entity.id}
                className="asset-card relative group"
              >
                {/* Color indicator */}
                <div 
                  className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
                  style={{ backgroundColor: entity.color || '#C4785A' }}
                />
                
                <div className="flex items-start gap-3 pl-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${entity.color}20` }}
                  >
                    {entity.icon || typeInfo?.icon || '👤'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">{entity.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {typeInfo?.label || entity.type}
                      </Badge>
                    </div>
                    
                    {entity.legal_name && (
                      <p className="text-xs text-muted-foreground truncate mb-2">
                        {entity.legal_name}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {assetCount} asset{assetCount !== 1 ? 's' : ''}
                      </span>
                      <span className="font-medium text-foreground">
                        {formatValue(totalValue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {entities.length === 0 && (
          <div className="text-center py-12">
            <Building size={48} strokeWidth={1} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="font-serif text-xl font-medium text-foreground mb-2">No entities yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your first entity to organize your wealth by ownership structure.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DemoEntitiesPage;
