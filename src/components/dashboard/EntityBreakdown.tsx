import { useEntities } from '@/hooks/useEntities';
import { useAssets } from '@/hooks/useAssets';
import { useCollections } from '@/hooks/useCollections';
import { useLiabilities } from '@/hooks/useLiabilities';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { convertToEUR, convertFromEUR, fallbackRates, formatCurrency } from '@/lib/currency';
import { useCurrency } from '@/contexts/CurrencyContext';
import { EntityIcon, getEntityIconName } from '@/components/entities/EntityIcon';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';

interface EntityBreakdownProps {
  delay?: number;
  isBlurred?: boolean;
}

export function EntityBreakdown({ delay = 0, isBlurred = false }: EntityBreakdownProps) {
  const navigate = useNavigate();
  const { data: entities = [] } = useEntities();
  const { data: assets = [] } = useAssets();
  const { data: collections = [] } = useCollections();
  const { data: liabilities = [] } = useLiabilities();
  const { data: exchangeRates } = useExchangeRates();
  const { displayCurrency } = useCurrency();
  const rates = exchangeRates?.rates || fallbackRates;

  // Helper to get entity's share from ownership_allocation
  const getEntityShareFromAllocation = (allocation: any[] | null, entityId: string): number => {
    if (!allocation || !Array.isArray(allocation)) return 0;
    const entry = allocation.find((a: any) => a.entity_id === entityId);
    return entry ? (entry.percentage || 0) / 100 : 0;
  };

  // Calculate value per entity
  const entityValues: Record<string, { assets: number; collections: number; liabilities: number; net: number }> = {};
  
  // Initialize with all entities
  entities.forEach(entity => {
    entityValues[entity.id] = { assets: 0, collections: 0, liabilities: 0, net: 0 };
  });
  
  // Add "Unassigned" for items without entity
  entityValues['unassigned'] = { assets: 0, collections: 0, liabilities: 0, net: 0 };

  // Sum assets (considering ownership_allocation for shared assets)
  assets.forEach(asset => {
    const eurValue = convertToEUR(asset.current_value, asset.currency, rates);
    const allocation = asset.ownership_allocation as any[] | null;
    
    if (allocation && Array.isArray(allocation) && allocation.length > 0) {
      // Shared ownership - distribute value according to allocation
      allocation.forEach((alloc: any) => {
        const entityId = alloc.entity_id;
        const share = (alloc.percentage || 0) / 100;
        if (!entityValues[entityId]) {
          entityValues[entityId] = { assets: 0, collections: 0, liabilities: 0, net: 0 };
        }
        entityValues[entityId].assets += eurValue * share;
      });
    } else {
      // Direct ownership via entity_id
      const entityId = asset.entity_id || 'unassigned';
      if (!entityValues[entityId]) {
        entityValues[entityId] = { assets: 0, collections: 0, liabilities: 0, net: 0 };
      }
      entityValues[entityId].assets += eurValue;
    }
  });

  // Sum collections (considering ownership_allocation)
  collections.forEach(collection => {
    const eurValue = convertToEUR(collection.current_value, collection.currency, rates);
    const allocation = collection.ownership_allocation as any[] | null;
    
    if (allocation && Array.isArray(allocation) && allocation.length > 0) {
      allocation.forEach((alloc: any) => {
        const entityId = alloc.entity_id;
        const share = (alloc.percentage || 0) / 100;
        if (!entityValues[entityId]) {
          entityValues[entityId] = { assets: 0, collections: 0, liabilities: 0, net: 0 };
        }
        entityValues[entityId].collections += eurValue * share;
      });
    } else {
      const entityId = collection.entity_id || 'unassigned';
      if (!entityValues[entityId]) {
        entityValues[entityId] = { assets: 0, collections: 0, liabilities: 0, net: 0 };
      }
      entityValues[entityId].collections += eurValue;
    }
  });

  // Sum liabilities (still use entity_id only)
  liabilities.forEach(liability => {
    const eurValue = convertToEUR(liability.current_balance, liability.currency, rates);
    const entityId = liability.entity_id || 'unassigned';
    if (!entityValues[entityId]) {
      entityValues[entityId] = { assets: 0, collections: 0, liabilities: 0, net: 0 };
    }
    entityValues[entityId].liabilities += eurValue;
  });

  // Calculate net values
  Object.keys(entityValues).forEach(entityId => {
    const ev = entityValues[entityId];
    ev.net = ev.assets + ev.collections - ev.liabilities;
  });

  // Filter out entities with no value and sort by net value
  const sortedEntities = Object.entries(entityValues)
    .filter(([_, values]) => values.assets > 0 || values.collections > 0 || values.liabilities > 0)
    .sort((a, b) => b[1].net - a[1].net);

  // Calculate total for percentages
  const totalNetEUR = sortedEntities.reduce((sum, [_, values]) => sum + Math.max(0, values.net), 0);

  const handleEntityClick = (entityId: string) => {
    if (entityId === 'unassigned') {
      navigate('/assets?entity=unassigned');
    } else {
      navigate(`/assets?entity=${entityId}`);
    }
  };

  const getEntity = (id: string) => entities.find(e => e.id === id);

  return (
    <div 
      className="animate-fade-in" 
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="space-y-3">
        {sortedEntities.map(([entityId, values], index) => {
          const entity = getEntity(entityId);
          const percentage = totalNetEUR > 0 ? (Math.max(0, values.net) / totalNetEUR) * 100 : 0;
          const displayValue = convertFromEUR(values.net, displayCurrency, rates);
          
          return (
            <div 
              key={entityId} 
              className="space-y-1.5 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
              onClick={() => handleEntityClick(entityId)}
            >
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  {entity ? (
                    <>
                      <EntityIcon 
                        iconName={entity.icon || getEntityIconName(entity.type)} 
                        entityType={entity.type} 
                        size="sm" 
                      />
                      <span className="text-foreground">{entity.name}</span>
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground hover:text-foreground transition-colors">Unassigned</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-foreground tabular-nums">
                    {isBlurred ? '•••••' : formatCurrency(displayValue, displayCurrency)}
                  </span>
                  <span className="text-muted-foreground tabular-nums w-12 text-right">
                    {isBlurred ? '•••' : `${percentage.toFixed(0)}%`}
                  </span>
                </div>
              </div>
              <div className="stat-bar">
                <div 
                  className={cn(
                    "stat-bar-fill",
                    entity?.color ? '' : 'bg-muted-foreground'
                  )}
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: entity?.color || undefined,
                    transitionDelay: `${delay + (index * 100)}ms`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
