import { Entity, ENTITY_TYPES } from '@/hooks/useEntities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Building2, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useComplianceMode } from '@/hooks/useComplianceMode';
import { EntityAvatar } from './EntityAvatar';

interface EntityCardProps {
  entity: Entity;
  displayName: string;
  assetCount: number;
  totalValue: number;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
  onClick?: () => void;
}

export const EntityCard = ({
  entity,
  displayName,
  assetCount,
  totalValue,
  currency,
  onEdit,
  onDelete,
  onClick,
}: EntityCardProps) => {
  const entityType = ENTITY_TYPES.find(t => t.value === entity.type);
  const isPersonal = entity.type === 'personal';
  const isHUF = entity.type === 'huf';
  const isWaqf = entity.trust_type === 'waqf';
  const { showHindu, showIslamic } = useComplianceMode();

  return (
    <Card 
      className="group hover:border-primary/30 transition-colors cursor-pointer"
      onClick={onClick}
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
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs font-normal">
                  {entityType?.label || entity.type}
                </Badge>
                {/* HUF compliance badge */}
                {showHindu && isHUF && (
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                    HUF
                  </Badge>
                )}
                {/* Waqf compliance badge */}
                {showIslamic && isWaqf && (
                  <Badge variant="secondary" className="text-xs bg-positive/10 text-positive border-positive/20">
                    Waqf
                  </Badge>
                )}
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
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            {!isPersonal && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                disabled={assetCount > 0}
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
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {formatCurrency(totalValue, currency)}
            </p>
          </div>
        </div>

        {entity.legal_name && (
          <p className="mt-2 text-xs text-muted-foreground truncate">
            {entity.legal_name}
          </p>
        )}
      </CardContent>
    </Card>
  );
};