import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Info, Building, Building2, MapPin, Edit2, Trash2 } from 'lucide-react';
import { useDemo } from '@/contexts/DemoContext';
import { ENTITY_TYPES } from '@/hooks/useEntities';
import { EntityAvatar } from '@/components/entities/EntityAvatar';
import { formatCurrency, convertToEUR, convertFromEUR } from '@/lib/currency';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import {
  ChevronDown,
  ExternalLink,
  Landmark,
  TrendingUp,
  Bitcoin,
  Briefcase,
  Watch,
  Car,
  Palette,
  Gem,
  Wine,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { getLiabilityIcon } from '@/components/liabilities/LiabilityIcon';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const assetTypeIcons: Record<string, typeof Building2> = {
  'real-estate': Building2,
  'bank': Landmark,
  'investment': TrendingUp,
  'crypto': Bitcoin,
  'business': Briefcase,
};

const collectionTypeIcons: Record<string, typeof Watch> = {
  'watch': Watch,
  'vehicle': Car,
  'art': Palette,
  'jewelry': Gem,
  'wine': Wine,
  'lp-position': BarChart3,
  'other': Sparkles,
};

const DemoEntitiesPage = () => {
  const { entities, assets, collections, liabilities, profile } = useDemo();
  const navigate = useNavigate();
  const [selectedEntity, setSelectedEntity] = useState<typeof entities[0] | null>(null);

  const displayCurrency = profile.base_currency || 'EUR';
  const exchangeRates: Record<string, number> = { EUR: 1, USD: 1.08, AED: 3.97, GBP: 0.86, CHF: 0.94 };

  const getEntityDisplayName = (entity: typeof entities[0]) => {
    if (entity.type === 'personal' && profile.full_name) {
      return profile.full_name;
    }
    return entity.name;
  };

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
    return formatCurrency(value, displayCurrency);
  };

  // Get entity details for drawer
  const entityAssets = useMemo(() => {
    if (!selectedEntity) return [];
    return assets.filter(a => a.entity_id === selectedEntity.id).map(a => {
      const valueInEur = convertToEUR(Number(a.current_value), a.currency, exchangeRates);
      const valueInDisplay = convertFromEUR(valueInEur, displayCurrency, exchangeRates);
      return { ...a, displayValue: valueInDisplay };
    });
  }, [selectedEntity, assets, exchangeRates, displayCurrency]);

  const entityCollections = useMemo(() => {
    if (!selectedEntity) return [];
    return collections.filter(c => c.entity_id === selectedEntity.id).map(c => {
      const valueInEur = convertToEUR(Number(c.current_value), c.currency, exchangeRates);
      const valueInDisplay = convertFromEUR(valueInEur, displayCurrency, exchangeRates);
      return { ...c, displayValue: valueInDisplay };
    });
  }, [selectedEntity, collections, exchangeRates, displayCurrency]);

  const entityLiabilities = useMemo(() => {
    if (!selectedEntity) return [];
    return liabilities.filter(l => l.entity_id === selectedEntity.id).map(l => {
      const valueInEur = convertToEUR(Number(l.current_balance), l.currency, exchangeRates);
      const valueInDisplay = convertFromEUR(valueInEur, displayCurrency, exchangeRates);
      return { ...l, displayValue: valueInDisplay };
    });
  }, [selectedEntity, liabilities, exchangeRates, displayCurrency]);

  const totals = useMemo(() => {
    const assetsTotal = entityAssets.reduce((sum, a) => sum + a.displayValue, 0);
    const collectionsTotal = entityCollections.reduce((sum, c) => sum + c.displayValue, 0);
    const liabilitiesTotal = entityLiabilities.reduce((sum, l) => sum + l.displayValue, 0);
    return {
      assets: assetsTotal,
      collections: collectionsTotal,
      liabilities: liabilitiesTotal,
      net: assetsTotal + collectionsTotal - liabilitiesTotal,
    };
  }, [entityAssets, entityCollections, entityLiabilities]);

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
            const displayName = getEntityDisplayName(entity);
            const isPersonal = entity.type === 'personal';

            return (
              <Card
                key={entity.id}
                className="group hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setSelectedEntity(entity)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <EntityAvatar 
                        avatarUrl={(entity as any).avatar_url}
                        entityType={entity.type}
                        entityColor={entity.color}
                        name={displayName}
                      />
                      
                      <div>
                        <h3 className="font-medium text-foreground">{displayName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs font-normal">
                            {typeInfo?.label || entity.type}
                          </Badge>
                          {entity.country && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {entity.country}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                        disabled
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {!isPersonal && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                          disabled
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                    
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{assetCount} asset{assetCount !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {formatValue(totalValue)}
                    </p>
                  </div>
                  
                  {entity.legal_name && (
                    <p className="mt-2 text-xs text-muted-foreground truncate">
                      {entity.legal_name}
                    </p>
                  )}
                </CardContent>
              </Card>
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

      {/* Entity Detail Drawer */}
      <Drawer open={!!selectedEntity} onOpenChange={(open) => !open && setSelectedEntity(null)}>
        <DrawerContent className="max-h-[90vh]">
          {selectedEntity && (
            <div className="overflow-y-auto max-h-[calc(90vh-2rem)]">
              <DrawerHeader className="border-b border-border pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <EntityAvatar
                      avatarUrl={(selectedEntity as any).avatar_url}
                      entityType={selectedEntity.type}
                      entityColor={selectedEntity.color}
                      name={getEntityDisplayName(selectedEntity)}
                      size="lg"
                    />
                    <div>
                      <DrawerTitle className="text-xl font-medium">
                        {getEntityDisplayName(selectedEntity)}
                      </DrawerTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {ENTITY_TYPES.find(t => t.value === selectedEntity.type)?.label || selectedEntity.type}
                        </Badge>
                        {selectedEntity.country && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {selectedEntity.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" disabled>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </DrawerHeader>

              <div className="p-4 space-y-4">
                {/* Assets Section */}
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors">
                    <span>Assets ({entityAssets.length})</span>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-1 mt-2">
                      {entityAssets.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No assets</p>
                      ) : (
                        entityAssets.map(asset => {
                          const Icon = assetTypeIcons[asset.type] || Building2;
                          return (
                            <div key={asset.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-secondary/50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <span className="text-sm text-foreground">{asset.name}</span>
                              </div>
                              <span className="text-sm font-medium tabular-nums">
                                {formatCurrency(asset.displayValue, displayCurrency)}
                              </span>
                            </div>
                          );
                        })
                      )}
                      {entityAssets.length > 0 && (
                        <div className="flex items-center justify-between py-2 px-2 border-t border-border/50 mt-2">
                          <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
                          <span className="text-sm font-semibold tabular-nums">
                            {formatCurrency(totals.assets, displayCurrency)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Collections Section */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors">
                    <span>Collections ({entityCollections.length})</span>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-1 mt-2">
                      {entityCollections.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No collections</p>
                      ) : (
                        entityCollections.map(collection => {
                          const Icon = collectionTypeIcons[collection.type] || Sparkles;
                          return (
                            <div key={collection.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-secondary/50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <span className="text-sm text-foreground">{collection.name}</span>
                              </div>
                              <span className="text-sm font-medium tabular-nums">
                                {formatCurrency(collection.displayValue, displayCurrency)}
                              </span>
                            </div>
                          );
                        })
                      )}
                      {entityCollections.length > 0 && (
                        <div className="flex items-center justify-between py-2 px-2 border-t border-border/50 mt-2">
                          <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
                          <span className="text-sm font-semibold tabular-nums">
                            {formatCurrency(totals.collections, displayCurrency)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Liabilities Section */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors">
                    <span>Liabilities ({entityLiabilities.length})</span>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-1 mt-2">
                      {entityLiabilities.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No liabilities</p>
                      ) : (
                        entityLiabilities.map(liability => {
                          const LIcon = getLiabilityIcon(liability.type);
                          return (
                            <div key={liability.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-secondary/50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
                                  <LIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <span className="text-sm text-foreground">{liability.name}</span>
                              </div>
                              <span className="text-sm font-medium tabular-nums text-negative">
                                -{formatCurrency(liability.displayValue, displayCurrency)}
                              </span>
                            </div>
                          );
                        })
                      )}
                      {entityLiabilities.length > 0 && (
                        <div className="flex items-center justify-between py-2 px-2 border-t border-border/50 mt-2">
                          <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
                          <span className="text-sm font-semibold tabular-nums text-negative">
                            -{formatCurrency(totals.liabilities, displayCurrency)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Net Position */}
                <div className="bg-secondary/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Net Position
                    </span>
                    <span className={cn(
                      "text-lg font-semibold tabular-nums",
                      totals.net >= 0 ? "text-positive" : "text-negative"
                    )}>
                      {formatCurrency(totals.net, displayCurrency)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Assets + Collections - Liabilities
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      setSelectedEntity(null);
                      navigate(`/demo/add-asset?entity=${selectedEntity.id}`);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset to this entity
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start text-muted-foreground"
                    onClick={() => {
                      setSelectedEntity(null);
                      navigate(`/demo/assets?entity=${selectedEntity.id}`);
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View all assets
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </AppLayout>
  );
};

export default DemoEntitiesPage;