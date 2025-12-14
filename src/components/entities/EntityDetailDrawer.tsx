import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Entity, ENTITY_TYPES } from '@/hooks/useEntities';
import { Asset } from '@/hooks/useAssets';
import { Tables } from '@/integrations/supabase/types';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import {
  Edit2,
  MapPin,
  ChevronDown,
  Plus,
  ExternalLink,
  Building2,
  Landmark,
  TrendingUp,
  Bitcoin,
  Briefcase,
  Watch,
  Car,
  Palette,
  Gem,
  Wine,
  Disc3,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { ShareAdvisorDialog } from '@/components/sharing/ShareAdvisorDialog';
import { formatCurrency, convertToEUR, convertFromEUR } from '@/lib/currency';
import { EntityAvatar } from './EntityAvatar';
import { LiabilityIcon, getLiabilityIcon } from '@/components/liabilities/LiabilityIcon';
import { cn } from '@/lib/utils';

type Collection = Tables<'collections'>;
type Liability = Tables<'liabilities'>;

interface EntityDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: Entity | null;
  displayName: string;
  assets: Asset[];
  collections: Collection[];
  liabilities: Liability[];
  exchangeRates: Record<string, number>;
  displayCurrency: string;
  onEdit: () => void;
}

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
  'vinyl': Disc3,
  'other': Sparkles,
};

const getEntityShareFromAllocation = (allocation: any[] | null, entityId: string): number => {
  if (!allocation || !Array.isArray(allocation)) return 0;
  const entry = allocation.find((a: any) => a.entity_id === entityId);
  return entry ? (entry.percentage || 0) / 100 : 0;
};

export const EntityDetailDrawer = ({
  open,
  onOpenChange,
  entity,
  displayName,
  assets,
  collections,
  liabilities,
  exchangeRates,
  displayCurrency,
  onEdit,
}: EntityDetailDrawerProps) => {
  const navigate = useNavigate();

  const entityAssets = useMemo(() => {
    if (!entity) return [];
    return assets.filter(a => {
      const allocation = a.ownership_allocation as any[] | null;
      if (allocation && Array.isArray(allocation) && allocation.length > 0) {
        return getEntityShareFromAllocation(allocation, entity.id) > 0;
      }
      return a.entity_id === entity.id;
    }).map(a => {
      const allocation = a.ownership_allocation as any[] | null;
      let share = 1;
      if (allocation && Array.isArray(allocation) && allocation.length > 0) {
        share = getEntityShareFromAllocation(allocation, entity.id);
      }
      const valueInEur = convertToEUR(Number(a.current_value), a.currency, exchangeRates) * share;
      const valueInDisplay = convertFromEUR(valueInEur, displayCurrency, exchangeRates);
      return { ...a, displayValue: valueInDisplay, share };
    });
  }, [entity, assets, exchangeRates, displayCurrency]);

  const entityCollections = useMemo(() => {
    if (!entity) return [];
    return collections.filter(c => {
      const allocation = c.ownership_allocation as any[] | null;
      if (allocation && Array.isArray(allocation) && allocation.length > 0) {
        return getEntityShareFromAllocation(allocation, entity.id) > 0;
      }
      return c.entity_id === entity.id;
    }).map(c => {
      const allocation = c.ownership_allocation as any[] | null;
      let share = 1;
      if (allocation && Array.isArray(allocation) && allocation.length > 0) {
        share = getEntityShareFromAllocation(allocation, entity.id);
      }
      const valueInEur = convertToEUR(Number(c.current_value), c.currency, exchangeRates) * share;
      const valueInDisplay = convertFromEUR(valueInEur, displayCurrency, exchangeRates);
      return { ...c, displayValue: valueInDisplay, share };
    });
  }, [entity, collections, exchangeRates, displayCurrency]);

  const entityLiabilities = useMemo(() => {
    if (!entity) return [];
    return liabilities.filter(l => l.entity_id === entity.id).map(l => {
      const valueInEur = convertToEUR(Number(l.current_balance), l.currency, exchangeRates);
      const valueInDisplay = convertFromEUR(valueInEur, displayCurrency, exchangeRates);
      return { ...l, displayValue: valueInDisplay };
    });
  }, [entity, liabilities, exchangeRates, displayCurrency]);

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

  if (!entity) return null;

  const entityType = ENTITY_TYPES.find(t => t.value === entity.type);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto max-h-[calc(90vh-2rem)]">
          <DrawerHeader className="border-b border-border pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <EntityAvatar
                  avatarUrl={(entity as any).avatar_url}
                  entityType={entity.type}
                  entityColor={entity.color}
                  name={displayName}
                  size="lg"
                />
                <div>
                  <DrawerTitle className="text-xl font-medium">
                    {displayName}
                  </DrawerTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {entityType?.label || entity.type}
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
              <Button variant="ghost" size="icon" onClick={onEdit}>
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
                            <div>
                              <span className="text-sm text-foreground">{asset.name}</span>
                              {asset.share < 1 && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({Math.round(asset.share * 100)}%)
                                </span>
                              )}
                            </div>
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
                            <div>
                              <span className="text-sm text-foreground">{collection.name}</span>
                              {collection.share < 1 && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({Math.round(collection.share * 100)}%)
                                </span>
                              )}
                            </div>
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
                  onOpenChange(false);
                  navigate(`/add-asset?entity=${entity.id}`);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Asset to this entity
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-muted-foreground"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/assets?entity=${entity.id}`);
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View all assets
              </Button>
              <ShareAdvisorDialog
                trigger={
                  <Button variant="ghost" className="justify-start text-muted-foreground">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Share with Advisor
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
